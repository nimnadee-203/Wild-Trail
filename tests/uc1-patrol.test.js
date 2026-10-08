const fs = require('firebase/firestore');
const { storageService: storage } = require('../src/storage/asyncStorage');
const { STORAGE_KEYS: K } = require('../src/storage/keys');
const {
  patrolApiService: api,
  calculateRouteDistance,
  mapScheduledToAssignedPatrol,
  MOCK_ASSIGNED_PATROLS,
} = require('../src/services/api/patrols');
const { offlineSyncService: sync } = require('../src/services/api/offlineSync');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
let values;
beforeEach(() => {
  values = new Map();
  AsyncStorage.getItem.mockImplementation(async (key) => values.get(key) ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => {
    values.set(key, value);
  });
  AsyncStorage.removeItem.mockImplementation(async (key) => {
    values.delete(key);
  });
  fs.getDocs.mockResolvedValue({ empty: true, docs: [] });
  fs.updateDoc.mockResolvedValue();
  fs.addDoc.mockResolvedValue({ id: 'remote' });
  fs.collection.mockImplementation((db, name) => name);
  fs.doc.mockImplementation((db, collection, id) => ({ collection, id }));
});
test('UC1 starts a session with initial route point and persists ranger status', async () => {
  const result = await api.startPatrolSession(MOCK_ASSIGNED_PATROLS[0]);
  expect(result).toMatchObject({
    patrolStatus: 'IN_PROGRESS',
    rangerStatus: 'ON_PATROL',
    pointCount: 1,
    actualPath: [expect.objectContaining({ latitude: 6.3672, longitude: 81.503 })],
  });
  expect(await api.getActivePatrolSession()).toEqual(result);
  expect(await api.getRangerStatus()).toBe('ON_PATROL');
  expect(fs.updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'on patrol' });
});
test('UC1 starts locally when remote update fails and route is empty', async () => {
  fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
  const session = await api.startPatrolSession({ ...MOCK_ASSIGNED_PATROLS[0], route: [] });
  expect(session.actualPath[0]).toMatchObject({ latitude: 6.3672, longitude: 81.503 });
  expect(await api.getActivePatrolSession()).toEqual(session);
});
test.each(['addActualPathPoint', 'addMarkedWaypoint', 'addPatrolObservation'])(
  'UC1 %s refuses to record without active session',
  async (method) => {
    expect(await api[method]({})).toBeNull();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  },
);
test('UC1 appends GPS points, manual waypoints and observations without losing existing data', async () => {
  await api.startPatrolSession(MOCK_ASSIGNED_PATROLS[0]);
  const point = { latitude: 6.4, longitude: 81.5, timestamp: '10:00' };
  expect((await api.addActualPathPoint(point)).pointCount).toBe(2);
  const waypoint = { ...point, id: 'manual', label: 'Gate' };
  expect((await api.addMarkedWaypoint(waypoint)).markedWaypoints).toEqual([waypoint]);
  const observation = { id: 'obs', notes: 'Fence damaged' };
  expect((await api.addPatrolObservation(observation)).observations).toEqual([observation]);
  expect((await api.getActivePatrolSession()).actualPath[1]).toEqual(point);
});
test.each([
  ['addActualPathPoint', 'actualPath'],
  ['addMarkedWaypoint', 'markedWaypoints'],
  ['addPatrolObservation', 'observations'],
])('UC1 %s supports legacy sessions without arrays', async (method, field) => {
  await storage.setItem(K.ACTIVE_PATROL, { sessionId: 'legacy' });
  expect((await api[method]({ id: 'new' }))[field]).toEqual([{ id: 'new' }]);
});
test('UC1 status falls back from stored status to session then AVAILABLE', async () => {
  expect(await api.getRangerStatus()).toBe('AVAILABLE');
  await storage.setItem(K.ACTIVE_PATROL, { rangerStatus: 'ON_PATROL' });
  expect(await api.getRangerStatus()).toBe('ON_PATROL');
  await api.setRangerStatus('AVAILABLE');
  expect((await api.getActivePatrolSession()).rangerStatus).toBe('AVAILABLE');
});
test('UC1 status can be saved without a session', async () => {
  await api.setRangerStatus('AVAILABLE');
  expect(await api.getActivePatrolSession()).toBeNull();
});
test.each([
  [0, 1],
  [2.4, 50],
  [9.6, 100],
  [-1, 1],
])('UC1 completion clamps distance %s to percentage %s', async (distanceKm, percentage) => {
  await storage.setItem(K.COMPLETED_PATROLS, [{ patrolId: 'old' }]);
  await api.startPatrolSession(MOCK_ASSIGNED_PATROLS[0]);
  const summary = await api.completePatrolSession('PAT-0156', {
    distanceKm,
    actualPath: [],
    markedWaypoints: [],
    observations: [],
    endTime: '12:00',
  });
  expect(summary).toMatchObject({
    completionPercentage: percentage,
    plannedDistanceKm: 4.8,
    patrolStatus: 'COMPLETED',
  });
  expect((await storage.getItem(K.COMPLETED_PATROLS)).map((x) => x.patrolId)).toEqual([
    'PAT-0156',
    'old',
  ]);
  expect(await api.getActivePatrolSession()).toBeNull();
  expect(await api.getRangerStatus()).toBe('AVAILABLE');
});
test('UC1 end still clears local session when Firestore fails', async () => {
  fs.updateDoc.mockRejectedValue(new Error('offline'));
  await api.startPatrolSession(MOCK_ASSIGNED_PATROLS[1]);
  expect(await api.endPatrolSession('PAT-0157')).toBe('AVAILABLE');
  expect(await api.getActivePatrolSession()).toBeNull();
});
test.each([
  [[], 4.8],
  [[[0, 0]], 4.8],
  [
    [
      [0, 0],
      [0, 0],
    ],
    4.8,
  ],
  [
    [
      [0, 0],
      [1, 0],
    ],
    111.19,
  ],
])('UC1 route distance handles boundary route %#', (route, expected) => {
  expect(calculateRouteDistance(route)).toBe(expected);
});
test.each([
  ['scheduled', 'ASSIGNED'],
  ['on patrol', 'IN_PROGRESS'],
  ['completed', 'COMPLETED'],
  ['cancelled', 'CANCELLED'],
])('UC1 maps scheduled status %s', (status, expected) => {
  const patrol = mapScheduledToAssignedPatrol({
    id: 'p',
    status,
    route: [{ longitude: 81, latitude: 6 }],
  });
  expect(patrol.status).toBe(expected);
  expect(patrol.route).toEqual([[81, 6]]);
});
test('UC1 assigned patrols merge completion history and survive database failure', async () => {
  await storage.setItem(K.COMPLETED_PATROLS, [
    { patrolId: 'PAT-0156', distanceKm: 3, completionPercentage: 62 },
  ]);
  fs.getDocs.mockRejectedValueOnce(new Error('offline'));
  const response = await api.getRangerAssignedPatrols();
  expect(response.data.find((x) => x.id === 'PAT-0156')).toMatchObject({
    status: 'COMPLETED',
    completedDistanceKm: 3,
    completionPercentage: 62,
  });
});
test('UC1 maps Firestore assignments and completion history', async () => {
  await storage.setItem(K.COMPLETED_PATROLS, [{ patrolId: 'remote', distanceKm: 1 }]);
  fs.getDocs.mockResolvedValue({
    empty: false,
    docs: [{ id: 'remote', data: () => ({ teamName: 'Alpha', status: 'scheduled' }) }],
  });
  expect((await api.getRangerAssignedPatrols()).data[0]).toMatchObject({
    id: 'remote',
    name: 'Alpha',
    status: 'COMPLETED',
    completionPercentage: 100,
  });
});
test.each(['WAYPOINT', 'OBSERVATION', 'PATROL_SUMMARY', 'INCIDENT', 'PATROL_POINT'])(
  'UC1/UC2 offline queue processes %s (PATROL_POINT has no remote writer)',
  async (type) => {
    const item = await sync.queueItem(type, { detail: 'saved' });
    expect(item.status).toBe('PENDING_SYNC');
    expect(await sync.syncPendingItems()).toEqual({ syncedCount: 1, remainingCount: 0 });
    expect((await sync.getQueue())[0].status).toBe('SUBMITTED');
    expect(fs.addDoc).toHaveBeenCalledTimes(type === 'PATROL_POINT' ? 0 : 1);
  },
);
test('UC1/UC2 exposes current sync failure defect: failed writes are marked submitted', async () => {
  await sync.queueItem('INCIDENT', {});
  fs.addDoc.mockRejectedValueOnce(new Error('offline'));
  expect(await sync.syncPendingItems()).toEqual({ syncedCount: 1, remainingCount: 0 });
  expect((await sync.getQueue())[0].status).toBe('SUBMITTED');
});
test('UC1 queue skips submitted items, uses simulated connectivity and clears', async () => {
  expect(await sync.isOnline()).toBe(true);
  await sync.setOnlineStatus(false);
  expect(await sync.isOnline()).toBe(false);
  expect(await sync.syncPendingItems()).toEqual({ syncedCount: 0, remainingCount: 0 });
  await sync.queueItem('WAYPOINT', {});
  await sync.syncPendingItems();
  await sync.queueItem('OBSERVATION', {});
  await sync.syncPendingItems();
  expect(fs.addDoc).toHaveBeenCalledTimes(2);
  await sync.clearQueue();
  expect(await sync.getQueue()).toEqual([]);
});
test('UC1 legacy patrol API sends start, point and end payloads', async () => {
  global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'p' }) });
  const coordinate = { latitude: 6, longitude: 81 };
  await api.startPatrol('r');
  await api.updatePatrolLocation('p', coordinate);
  await api.endPatrol('p', 'Done');
  expect(global.fetch.mock.calls.map((call) => call[1].body)).toEqual([
    JSON.stringify({ rangerId: 'r' }),
    JSON.stringify(coordinate),
    JSON.stringify({ notes: 'Done' }),
  ]);
  expect(global.fetch.mock.calls.map((call) => call[0])).toEqual([
    expect.stringContaining('/patrols/start'),
    expect.stringContaining('/patrols/p/location'),
    expect.stringContaining('/patrols/p/end'),
  ]);
});
