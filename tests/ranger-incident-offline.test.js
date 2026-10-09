jest.mock('../src/services/incidentReporter', () => ({
  getIncidentReporter: jest.fn(),
  DEFAULT_INCIDENT_RANGER: { name: 'Ranger Nimal', badgeNumber: 'RANGER-409' },
}));
jest.mock('../src/services/cloudinary', () => ({ uploadIncidentPhoto: jest.fn() }));
jest.mock('../src/services/communityPhoto', () => ({ retainCommunityPhoto: jest.fn() }));
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(), addNetworkStateListener: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const React = require('react');
const { render, fireEvent, waitFor, act } = require('@testing-library/react-native');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const firestore = require('firebase/firestore');
const { auth } = require('../src/services/firebase');
const Network = require('expo-network');
const { getIncidentReporter } = require('../src/services/incidentReporter');
const { uploadIncidentPhoto } = require('../src/services/cloudinary');
const { retainCommunityPhoto } = require('../src/services/communityPhoto');
const queue = require('../src/services/rangerIncidentQueue');
const { RangerIncidentOfflinePanel } = require('../src/components/RangerIncidentOfflinePanel');
const { RangerIncidentSync } = require('../src/components/RangerIncidentSync');
const QUEUE_KEY = '@wildtrail_ranger_incident_queue_v1';
const SIMULATOR_KEY = '@wildtrail_ranger_incident_offline_v1';
const input = {
  category: 'snare_detected', title: ' Snare ', description: ' Wire trap near gate ',
  severity: 'critical', location: { latitude: 6.4, longitude: 81.5, accuracy: 5 },
};
let storage, documents, nextId, transaction;
beforeEach(async () => {
  // Finish any previous background attempt before replacing the in-memory disk.
  await queue.syncRangerIncidents().catch(() => undefined);
  storage = new Map(); documents = new Map(); nextId = 0;
  AsyncStorage.getItem.mockImplementation(async key => storage.get(key) ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => { storage.set(key, value); });
  auth.currentUser = { uid: 'ranger', isAnonymous: false };
  getIncidentReporter.mockResolvedValue(auth.currentUser);
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  Network.addNetworkStateListener.mockReturnValue({ remove: jest.fn() });
  retainCommunityPhoto.mockImplementation(async uri => `durable:${uri}`);
  uploadIncidentPhoto.mockImplementation(async uri => `https://photos.example/${uri}`);
  firestore.doc.mockImplementation((...args) => args.length === 1
    ? { id: `incident-${++nextId}` } : { collection: args[1], id: args[2] });
  transaction = {
    get: jest.fn(async ref => ({ exists: () => documents.has(ref.id), data: () => documents.get(ref.id) })),
    set: jest.fn((ref, data) => documents.set(ref.id, data)),
    update: jest.fn((ref, data) => documents.set(ref.id, { ...documents.get(ref.id), ...data })),
  };
  firestore.runTransaction.mockImplementation(async (_db, work) => work(transaction));
  await queue.setRangerSimulatedOffline(true);
  // Reset calls introduced by setup.
  firestore.runTransaction.mockClear(); getIncidentReporter.mockClear();
});
afterEach(async () => { await queue.syncRangerIncidents(); });

test('Offline incidents and photos are durably saved without authentication or remote writes', async () => {
  auth.currentUser = null;
  const saved = await queue.saveRangerIncident({ ...input, photoUris: ['camera:1'] });
  await queue.syncRangerIncidents();
  expect(saved).toMatchObject({ syncStatus: 'waiting', input: { severity: 'critical', title: 'Snare' }, localPhotos: ['durable:camera:1'] });
  expect(JSON.parse(storage.get(QUEUE_KEY))).toEqual([saved]);
  expect(await queue.getRangerIncidentQueue()).toEqual([saved]);
  expect(getIncidentReporter).not.toHaveBeenCalled();
  expect(firestore.runTransaction).not.toHaveBeenCalled();
  expect(uploadIncidentPhoto).not.toHaveBeenCalled();
  expect(storage.get(SIMULATOR_KEY)).toBe('true');
});

test('A fresh app session restores the offline simulator and the reports from persistent storage', async () => {
  const saved = await queue.saveRangerIncident(input);
  await queue.syncRangerIncidents();
  let restarted;
  jest.isolateModules(() => { restarted = require('../src/services/rangerIncidentQueue'); });
  await restarted.loadRangerIncidentSettings();
  expect(restarted.getRangerSimulatedOffline()).toBe(true);
  expect(await restarted.getRangerIncidentQueue()).toEqual([saved]);
  await restarted.syncRangerIncidents();
  expect(firestore.runTransaction).not.toHaveBeenCalled();
});

test('Restoring Internet automatically uploads exactly one incident and syncs its durable photos', async () => {
  const saved = await queue.saveRangerIncident({ ...input, photoUris: ['camera:1', 'gallery:2'] });
  await queue.syncRangerIncidents();
  await queue.setRangerSimulatedOffline(false);
  await waitFor(async () => expect((await queue.getRangerIncidentQueue())[0].syncStatus).toBe('synced'));
  expect(documents.size).toBe(1);
  expect(documents.get(saved.id)).toMatchObject({
    reporterId: 'ranger', category: 'snare_detected', severity: 'critical', status: 'pending',
    title: 'Snare', description: 'Wire trap near gate', location: input.location,
    photoUris: ['https://photos.example/durable:camera:1', 'https://photos.example/durable:gallery:2'],
  });
  await Promise.all([queue.syncRangerIncidents(), queue.syncRangerIncidents()]);
  expect(transaction.set).toHaveBeenCalledTimes(1);
  expect(uploadIncidentPhoto).toHaveBeenCalledTimes(2);
});

test('Real offline connectivity queues reports and a network restoration event automatically syncs', async () => {
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });
  await queue.setRangerSimulatedOffline(false);
  const saved = await queue.saveRangerIncident(input);
  await queue.syncRangerIncidents();
  expect((await queue.getRangerIncidentQueue())[0].syncStatus).toBe('waiting');
  expect(firestore.runTransaction).not.toHaveBeenCalled();
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  queue.updateRangerIncidentNetwork({ isConnected: true, isInternetReachable: true });
  await waitFor(async () => expect((await queue.getRangerIncidentQueue())[0].syncStatus).toBe('synced'));
  expect(documents.has(saved.id)).toBe(true);
});

test('Remote failure keeps report local, then a retry reuses the same reference', async () => {
  const saved = await queue.saveRangerIncident(input);
  await queue.syncRangerIncidents();
  firestore.runTransaction.mockRejectedValue(new Error('Permission denied'));
  await queue.setRangerSimulatedOffline(false);
  await waitFor(async () => expect((await queue.getRangerIncidentQueue())[0]).toMatchObject({ syncStatus: 'failed', error: 'Permission denied' }));
  expect(documents.size).toBe(0);
  firestore.runTransaction.mockImplementation(async (_db, work) => work(transaction));
  await queue.syncRangerIncidents();
  expect((await queue.getRangerIncidentQueue())[0]).toMatchObject({ id: saved.id, syncStatus: 'synced' });
  expect(documents.size).toBe(1);
});

test('Interrupted attachment linking resumes without uploading again or creating another incident', async () => {
  await queue.saveRangerIncident({ ...input, photoUris: ['photo'] });
  await queue.syncRangerIncidents();
  firestore.runTransaction.mockImplementation(async (_db, work) => {
    if (documents.size) throw new Error('Link update failed');
    return work(transaction);
  });
  await queue.setRangerSimulatedOffline(false);
  await waitFor(async () => expect((await queue.getRangerIncidentQueue())[0].syncStatus).toBe('failed'));
  expect((await queue.getRangerIncidentQueue())[0]).toMatchObject({ received: true, uploadedPhotos: ['https://photos.example/durable:photo'] });
  firestore.runTransaction.mockImplementation(async (_db, work) => work(transaction));
  await queue.syncRangerIncidents();
  expect(uploadIncidentPhoto).toHaveBeenCalledTimes(1);
  expect(transaction.set).toHaveBeenCalledTimes(1);
  expect((await queue.getRangerIncidentQueue())[0].syncStatus).toBe('synced');
});

test('Local storage failure never reports a successful save', async () => {
  AsyncStorage.setItem.mockRejectedValueOnce(new Error('Disk full'));
  await expect(queue.saveRangerIncident(input)).rejects.toThrow('Disk full');
  expect(await queue.getRangerIncidentQueue()).toEqual([]);
  expect(firestore.runTransaction).not.toHaveBeenCalled();
});

test('Another signed-in ranger cannot view or sync a report owned by the first ranger', async () => {
  await queue.saveRangerIncident(input);
  await queue.syncRangerIncidents();
  auth.currentUser = { uid: 'other-ranger' };
  getIncidentReporter.mockResolvedValue(auth.currentUser);
  expect(await queue.getRangerIncidentQueue()).toEqual([]);
  await queue.setRangerSimulatedOffline(false);
  await queue.syncRangerIncidents();
  expect(firestore.runTransaction).not.toHaveBeenCalled();
  expect(JSON.parse(storage.get(QUEUE_KEY))[0].syncStatus).toBe('waiting');
});

test('Offline panel shows persistent local saving and changes to synced after restoring Internet', async () => {
  await queue.saveRangerIncident(input);
  const screen = await render(React.createElement(RangerIncidentOfflinePanel));
  await waitFor(() => expect(screen.getByText('View saved reports')).toBeTruthy());
  await fireEvent.press(screen.getByText('View saved reports'));
  await waitFor(() => expect(screen.getByText('Saved on device · Waiting to sync')).toBeTruthy());
  expect(screen.getByText('Offline simulation active')).toBeTruthy();
  expect(screen.getByText('Reference: incident-1')).toBeTruthy();
  await fireEvent.press(screen.getByText('Restore Internet'));
  await waitFor(() => expect(screen.getByText('Synced with Operations')).toBeTruthy());
  expect(screen.getByText('0 waiting · 1 synced')).toBeTruthy();
});

test('Root sync listener handles device reconnection while the report screen is closed', async () => {
  await queue.saveRangerIncident(input);
  await queue.syncRangerIncidents();
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });
  const screen = await render(React.createElement(RangerIncidentSync));
  await act(async () => { await queue.setRangerSimulatedOffline(false); });
  Network.getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  const callback = Network.addNetworkStateListener.mock.calls.at(-1)[0];
  await act(async () => { callback({ isConnected: true, isInternetReachable: true }); });
  await waitFor(async () => expect((await queue.getRangerIncidentQueue())[0].syncStatus).toBe('synced'));
  await screen.unmount();
  expect(Network.addNetworkStateListener.mock.results.at(-1).value.remove).toHaveBeenCalled();
});
