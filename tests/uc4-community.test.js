jest.mock('../src/services/incidentReporter', () => ({ getIncidentReporter: jest.fn() }));
jest.mock('../src/services/cloudinary', () => ({ uploadIncidentPhoto: jest.fn() }));
jest.mock('../src/services/communityPhoto', () => ({ retainCommunityPhoto: jest.fn() }));
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const fs = require('firebase/firestore');
const { auth } = require('../src/services/firebase');
const { getIncidentReporter } = require('../src/services/incidentReporter');
const { uploadIncidentPhoto } = require('../src/services/cloudinary');
const { retainCommunityPhoto } = require('../src/services/communityPhoto');
const api = require('../src/services/communityReports');
const { COMMUNITY_REPORT_KINDS, COMMUNITY_REPORT_TYPES } = require('../src/types/community');
const input = {
  kind: 'crop_raiding',
  village: 'Village',
  boundarySection: 'East',
  landmark: 'Gate',
  description: 'Damage',
  contactPhone: '123',
  occurredAt: '2026-01-01',
  source: 'community_app',
};
let records, values, nextId, transaction;
beforeEach(async () => {
  records = new Map();
  values = new Map();
  nextId = 0;
  AsyncStorage.getItem.mockImplementation(async (key) => values.get(key) ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => {
    values.set(key, value);
  });
  auth.currentUser = { uid: 'resident' };
  auth.authStateReady.mockResolvedValue();
  getIncidentReporter.mockImplementation(async () => auth.currentUser);
  fs.collection.mockImplementation((db, name) => name);
  fs.doc.mockImplementation((db, collection, id) => ({
    id: id || `report-${++nextId}`,
    collection,
  }));
  transaction = {
    get: jest.fn(async (ref) => ({
      exists: () => records.has(ref.id),
      data: () => records.get(ref.id),
    })),
    set: jest.fn((ref, data) => records.set(ref.id, { ...data })),
    update: jest.fn((ref, data) => records.set(ref.id, { ...records.get(ref.id), ...data })),
  };
  fs.runTransaction.mockImplementation(async (db, work) => work(transaction));
  fs.updateDoc.mockImplementation(async (ref, data) =>
    records.set(ref.id, { ...records.get(ref.id), ...data }),
  );
  fs.getDoc.mockImplementation(async (ref) => ({ data: () => records.get(ref.id) }));
  retainCommunityPhoto.mockImplementation(async (uri) => `retained:${uri}`);
  uploadIncidentPhoto.mockResolvedValue('https://photos.example/1');
  api.setSimulatedOffline(false);
  await api.syncCommunityReports();
});
test.each(COMMUNITY_REPORT_KINDS)('UC4 accepts category %s and parses its SMS keyword', (kind) => {
  expect(() => api.validateCommunityInput({ ...input, kind })).not.toThrow();
  const parsed = api.parseCommunitySms(
    `${COMMUNITY_REPORT_TYPES[kind].keyword.toLowerCase()} | Village | East | Gate | Damage`,
    ' 123 ',
  );
  expect(parsed).toMatchObject({ kind, contactPhone: '123', source: 'sms_simulated' });
});
test.each(['village', 'boundarySection', 'landmark', 'description'])(
  'UC4 rejects blank required field %s',
  (field) => {
    expect(() => api.validateCommunityInput({ ...input, [field]: '  ' })).toThrow(
      'Enter the village',
    );
  },
);
test.each([{ kind: 'invalid' }, { occurredAt: 'invalid' }])(
  'UC4 rejects invalid category/date %#',
  (invalid) => {
    expect(() => api.validateCommunityInput({ ...input, ...invalid })).toThrow();
  },
);
test.each([
  'BAD | Village | East | Gate | Damage',
  'CROP | incomplete',
  'CROP | V | E | G | D | extra',
  'CROP |  | E | G | D',
])('UC4 rejects malformed SMS %s', (body) => {
  expect(() => api.parseCommunitySms(body, '')).toThrow();
});
test('UC4 saves durable photos locally and confirms waiting status without remote write', async () => {
  const entry = await api.queueCommunityReport(input, ['photo']);
  expect(entry).toMatchObject({
    ownerUid: 'resident',
    localPhotos: ['retained:photo'],
    complete: false,
  });
  expect(api.getReportSyncStatus(entry)).toBe('waiting');
  expect(records.size).toBe(0);
  expect(await api.getCommunityQueue()).toEqual([entry]);
});
test('UC4 photo retention failure never queues incomplete report', async () => {
  retainCommunityPhoto.mockRejectedValueOnce(new Error('disk full'));
  await expect(api.queueCommunityReport(input, ['photo'])).rejects.toThrow('disk full');
  expect(await api.getCommunityQueue()).toEqual([]);
});
test('UC4 concurrent local submissions preserve both reports', async () => {
  await Promise.all([api.queueCommunityReport(input, []), api.queueCommunityReport(input, [])]);
  expect((await api.getCommunityQueue()).map((x) => x.id)).toEqual(['report-1', 'report-2']);
});
test('UC4 offline report remains waiting until connectivity returns', async () => {
  api.setSimulatedOffline(true);
  await api.queueCommunityReport(input, []);
  await api.syncCommunityReports();
  expect(records.size).toBe(0);
  expect((await api.getCommunityQueue())[0].complete).toBe(false);
  api.setSimulatedOffline(false);
  await api.syncCommunityReports();
  expect((await api.getCommunityQueue())[0].complete).toBe(true);
});
test('UC4 sync uses stable ID, manual landmark address and optional GPS; avoids duplicates', async () => {
  const entry = await api.queueCommunityReport(
    { ...input, urgentAlert: { latitude: 0, longitude: 0, animal: 'Elephant', direction: 'East' } },
    [],
  );
  const first = api.syncCommunityReports();
  expect(api.syncCommunityReports()).toBe(first);
  await first;
  await api.syncCommunityReports();
  expect(records.size).toBe(1);
  expect(transaction.set).toHaveBeenCalledTimes(1);
  expect(records.get(entry.id)).toMatchObject({
    reporterType: 'community',
    category: 'crop_damage',
    status: 'pending',
    location: { address: 'Village, East: Gate', latitude: 0, longitude: 0 },
  });
});
test('UC4 failed upload retries without recreating report or overwriting staff response', async () => {
  const entry = await api.queueCommunityReport(input, ['photo']);
  uploadIncidentPhoto.mockRejectedValueOnce(new Error('offline'));
  await api.syncCommunityReports();
  expect(api.getReportSyncStatus((await api.getCommunityQueue())[0])).toBe('failed');
  await api.respondToCommunityReport(entry.id, 'investigating', ' On the way ');
  await api.syncCommunityReports();
  expect(records.get(entry.id)).toMatchObject({
    status: 'investigating',
    responseNotes: 'On the way',
    photoUris: ['https://photos.example/1'],
  });
  expect(transaction.set).toHaveBeenCalledTimes(1);
  expect((await api.getCommunityQueue())[0].complete).toBe(true);
});
test('UC4 failed link update retries without uploading retained photo again', async () => {
  await api.queueCommunityReport(input, ['photo']);
  fs.updateDoc.mockRejectedValueOnce(new Error('denied'));
  await api.syncCommunityReports();
  await api.syncCommunityReports();
  expect(uploadIncidentPhoto).toHaveBeenCalledTimes(1);
  expect((await api.getCommunityQueue())[0].complete).toBe(true);
});
test('UC4 transaction failure records error and can retry', async () => {
  await api.queueCommunityReport(input, []);
  fs.runTransaction.mockRejectedValueOnce('offline');
  await api.syncCommunityReports();
  expect((await api.getCommunityQueue())[0].error).toBe('Waiting for connection.');
  await api.syncCommunityReports();
  expect((await api.getCommunityQueue())[0].complete).toBe(true);
});
test('UC4 existing server document is not overwritten', async () => {
  const entry = await api.queueCommunityReport(input, []);
  records.set(entry.id, { status: 'resolved' });
  await api.syncCommunityReports();
  expect(records.get(entry.id).status).toBe('resolved');
  expect(transaction.set).not.toHaveBeenCalled();
});
test('UC4 sync filters by target and owner', async () => {
  const first = await api.queueCommunityReport(input, []),
    second = await api.queueCommunityReport(input, []);
  await api.syncCommunityReports(first.id);
  expect(records.has(second.id)).toBe(false);
  auth.currentUser = { uid: 'other' };
  await api.syncCommunityReports();
  expect(records.has(second.id)).toBe(false);
});
test.each([
  [{ complete: true }, 'synced'],
  [{ syncStatus: 'synced' }, 'synced'],
  [{ syncStatus: 'syncing' }, 'syncing'],
  [{ error: 'failed' }, 'failed'],
  [{ syncStatus: 'failed' }, 'failed'],
  [{}, 'waiting'],
])('UC4 reports sync status %#', (entry, expected) => {
  expect(api.getReportSyncStatus(entry)).toBe(expected);
});
test('UC4 network subscriptions unsubscribe and isolate failing listeners', () => {
  const listener = jest.fn();
  const stop = api.subscribeNetworkStatus(listener);
  const stopBad = api.subscribeNetworkStatus(() => {
    throw new Error('listener');
  });
  api.setSimulatedOffline(true);
  expect(listener).toHaveBeenCalledWith(false);
  expect(api.getSimulatedOffline()).toBe(true);
  stop();
  stopBad();
  api.setSimulatedOffline(true);
  expect(listener).toHaveBeenCalledTimes(1);
});
test.each([null, { uid: 'anon', isAnonymous: true }])(
  'UC4 anonymous users cannot accept operations %#',
  async (user) => {
    auth.currentUser = user;
    await expect(api.acceptCommunityOperation('a')).rejects.toThrow('Sign in');
  },
);
test.each(['manager', 'community', 'admin'])(
  'UC4 role %s cannot accept ranger operations',
  async (role) => {
    auth.currentUser = { uid: 'officer', getIdTokenResult: async () => ({ claims: { role } }) };
    await expect(api.acceptCommunityOperation('a')).rejects.toThrow('Only rangers');
  },
);
test.each(['ranger', 'liaison'])('UC4 active %s accepts pending operation', async (role) => {
  auth.currentUser = { uid: 'officer', getIdTokenResult: async () => ({ claims: {} }) };
  records.set('officer', { accountStatus: 'ACTIVE', role, name: 'Officer' });
  records.set('a', { reporterType: 'community', status: 'pending', assignedTo: '' });
  await api.acceptCommunityOperation('a');
  expect(records.get('a')).toMatchObject({
    assignedTo: 'officer',
    assignedName: 'Officer',
    status: 'investigating',
  });
  await expect(api.acceptCommunityOperation('a')).rejects.toThrow('already been accepted');
});
test.each([
  undefined,
  { reporterType: 'ranger' },
  { reporterType: 'community', status: 'resolved' },
])('UC4 rejects missing or unavailable operation %#', async (report) => {
  auth.currentUser = {
    uid: 'officer',
    getIdTokenResult: async () => ({ claims: { role: 'ranger' } }),
  };
  if (report) records.set('a', report);
  await expect(api.acceptCommunityOperation('a')).rejects.toThrow();
  expect(transaction.update).not.toHaveBeenCalled();
});
test('UC4 response propagates database error', async () => {
  fs.updateDoc.mockRejectedValueOnce(new Error('denied'));
  await expect(api.respondToCommunityReport('a', 'resolved', 'done')).rejects.toThrow('denied');
});
test('UC4 demo officer accepts locally, rejects duplicates, and saves trimmed response', async () => {
  auth.currentUser = { uid: 'anonymous', isAnonymous: true };
  values.set(
    '@wildlife_user_profile',
    JSON.stringify({
      uid: 'usr-ranger-204',
      role: 'ranger',
      email: 'nimal@wildguard.org',
      name: 'Nimal',
      accountStatus: 'ACTIVE',
    }),
  );
  records.set('demo', { reporterType: 'community', status: 'pending', assignedTo: '' });
  await expect(api.respondToCommunityReport('demo', 'resolved', 'Done')).rejects.toThrow(
    'Accept this operation',
  );
  await api.acceptCommunityOperation('demo');
  expect(records.get('demo').assignedTo).toBe('');
  await expect(api.acceptCommunityOperation('demo')).rejects.toThrow('already been accepted');
  await api.respondToCommunityReport('demo', 'resolved', ' Done ');
  expect(JSON.parse(values.get('@wildtrail_demo_community_responses_v1')).demo).toMatchObject({
    status: 'resolved',
    responseNotes: 'Done',
    assignedName: 'Nimal',
  });
});
test.each([
  undefined,
  { reporterType: 'ranger' },
  { reporterType: 'community', status: 'resolved' },
])('UC4 demo acceptance validates availability %#', async (report) => {
  auth.currentUser = null;
  values.set(
    '@wildlife_user_profile',
    JSON.stringify({
      uid: 'usr-liaison-305',
      role: 'liaison',
      email: 'liaison@wildguard.org',
      accountStatus: 'ACTIVE',
    }),
  );
  if (report) records.set('demo', report);
  await expect(api.acceptCommunityOperation('demo')).rejects.toThrow();
});
test('UC4 report subscription converts dates, sorts and cleans up', async () => {
  const change = jest.fn(),
    error = jest.fn(),
    stop = jest.fn();
  fs.onSnapshot.mockReturnValue(stop);
  const cleanup = api.watchCommunityReports(change, error);
  fs.onSnapshot.mock.calls.at(-1)[1]({
    docs: [
      { id: 'old', data: () => ({ createdAt: { toDate: () => new Date('2026-01-01') } }) },
      {
        id: 'new',
        data: () => ({
          createdAt: { toDate: () => new Date('2026-02-01') },
          receivedAt: { toDate: () => new Date('2026-02-01') },
        }),
      },
    ],
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(change.mock.calls[0][0].map((x) => x.id)).toEqual(['new', 'old']);
  expect(change.mock.calls[0][0][1].receivedAt).toBe('');
  cleanup();
  expect(stop).toHaveBeenCalledTimes(1);
});
