import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { DEFAULT_INCIDENT_RANGER, getIncidentReporter } from './incidentReporter';
import { uploadIncidentPhoto } from './cloudinary';
import { retainCommunityPhoto } from './communityPhoto';
import type { CreateIncidentInput } from './api/incidents';

export type RangerIncidentSyncStatus = 'waiting' | 'syncing' | 'synced' | 'failed';
export interface QueuedRangerIncident {
  id: string;
  input: CreateIncidentInput;
  createdAt: string;
  ownerUid?: string;
  localPhotos: string[];
  uploadedPhotos: string[];
  received: boolean;
  syncStatus: RangerIncidentSyncStatus;
  syncedAt?: string;
  error?: string;
}

const QUEUE_KEY = '@wildtrail_ranger_incident_queue_v1';
const SIMULATOR_KEY = '@wildtrail_ranger_incident_offline_v1';
const listeners = new Set<() => void>();
let storageLock: Promise<unknown> = Promise.resolve();
let settings: Promise<void> | undefined;
let syncing: Promise<void> | undefined;
let simulatedOffline = false;
let connected = true;
let resyncRequested = false;

function locked<T>(work: () => Promise<T>): Promise<T> {
  const result = storageLock.then(work, work);
  storageLock = result.catch(() => undefined);
  return result;
}
function notify() { listeners.forEach(listener => listener()); }
async function readQueue(): Promise<QueuedRangerIncident[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function belongsToCurrentUser(entry: QueuedRangerIncident) {
  return !entry.ownerUid || entry.ownerUid === auth.currentUser?.uid;
}
async function checkpoint(entry: QueuedRangerIncident) {
  await locked(async () => {
    const queue = await readQueue();
    const index = queue.findIndex(item => item.id === entry.id);
    if (index < 0) throw new Error('The locally saved report could not be found.');
    queue[index] = entry;
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  });
  notify();
}

export function subscribeRangerIncidentQueue(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export const isRangerIncidentOnline = () => connected && !simulatedOffline;
export const getRangerSimulatedOffline = () => simulatedOffline;
export function loadRangerIncidentSettings() {
  if (!settings) settings = AsyncStorage.getItem(SIMULATOR_KEY).then(value => {
    simulatedOffline = value === 'true';
    notify();
  }).catch(error => { settings = undefined; throw error; });
  return settings;
}
export async function getRangerIncidentQueue() {
  await auth.authStateReady();
  return (await locked(readQueue)).filter(belongsToCurrentUser);
}
export function updateRangerIncidentNetwork(state: Network.NetworkState) {
  connected = state.isConnected !== false && state.isInternetReachable !== false;
  notify();
  if (isRangerIncidentOnline()) void syncRangerIncidents().catch(() => undefined);
}
export async function setRangerSimulatedOffline(offline: boolean) {
  await loadRangerIncidentSettings();
  await AsyncStorage.setItem(SIMULATOR_KEY, String(offline));
  simulatedOffline = offline;
  notify();
  if (!offline) void syncRangerIncidents().catch(() => undefined);
}

export async function saveRangerIncident(input: CreateIncidentInput): Promise<QueuedRangerIncident> {
  if (!input.description.trim()) throw new Error('A description is required.');
  if (!input.title.trim()) throw new Error('An incident type is required.');
  if (!Number.isFinite(input.location.latitude) || !Number.isFinite(input.location.longitude)) {
    throw new Error('A valid incident location is required.');
  }
  // Allocating a Firestore document ID is local and needs neither internet nor sign-in.
  const id = doc(collection(db, 'incidents')).id;
  const localPhotos: string[] = [];
  for (const [index, uri] of (input.photoUris ?? []).entries()) {
    localPhotos.push(await retainCommunityPhoto(uri, `ranger-${id}`, index));
  }
  const details = { category: input.category, title: input.title, description: input.description,
    location: input.location, ...(input.severity ? { severity: input.severity } : {}) };
  const entry: QueuedRangerIncident = {
    id, input: { ...details, title: input.title.trim(), description: input.description.trim() },
    createdAt: new Date().toISOString(), localPhotos, uploadedPhotos: [], received: false, syncStatus: 'waiting',
    ...(auth.currentUser ? { ownerUid: auth.currentUser.uid } : {}),
  };
  await locked(async () => {
    const queue = await readQueue();
    queue.push(entry);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  });
  notify();
  void syncRangerIncidents().catch(() => undefined);
  return entry;
}

async function runSync() {
  await loadRangerIncidentSettings();
  if (simulatedOffline) return;
  const queue = await getRangerIncidentQueue();
  if (!queue.some(entry => entry.syncStatus !== 'synced')) return;
  const network = await Network.getNetworkStateAsync();
  connected = network.isConnected !== false && network.isInternetReachable !== false;
  notify();
  if (!isRangerIncidentOnline()) return;

  let reporter: Awaited<ReturnType<typeof getIncidentReporter>>;
  try {
    reporter = await getIncidentReporter();
  } catch (error) {
    for (const entry of queue.filter(item => item.syncStatus !== 'synced')) {
      entry.syncStatus = 'failed';
      entry.error = error instanceof Error ? error.message : 'Sign-in is needed to sync. Your report remains saved on this device.';
      await checkpoint(entry);
    }
    return;
  }
  for (const entry of queue) {
    if (!isRangerIncidentOnline()) break;
    if (entry.syncStatus === 'synced' || (entry.ownerUid && entry.ownerUid !== reporter.uid)) continue;
    // Never upload another account's report if sign-in changed during sync.
    if (auth.currentUser?.uid !== reporter.uid) break;
    entry.ownerUid = reporter.uid;
    entry.syncStatus = 'syncing';
    delete entry.error;
    await checkpoint(entry);
    try {
      const reference = doc(db, 'incidents', entry.id);
      if (!entry.received) {
        if (!isRangerIncidentOnline()) throw new Error('Waiting for connectivity.');
        // Transactions fail while offline. Stable IDs also make retries safe after an interrupted save.
        await runTransaction(db, async transaction => {
          const existing = await transaction.get(reference);
          if (!existing.exists()) transaction.set(reference, {
            ...entry.input, reporterId: reporter.uid,
            ...(reporter.isAnonymous ? {
              reporterName: DEFAULT_INCIDENT_RANGER.name,
              reporterBadgeNumber: DEFAULT_INCIDENT_RANGER.badgeNumber,
            } : {}),
            severity: entry.input.severity ?? 'medium', status: 'pending', photoUris: [],
            createdAt: new Date(entry.createdAt), updatedAt: Timestamp.now(),
          });
        });
        entry.received = true;
        await checkpoint(entry);
      }
      for (let index = entry.uploadedPhotos.length; index < entry.localPhotos.length; index++) {
        if (!isRangerIncidentOnline()) throw new Error('Waiting for connectivity.');
        entry.uploadedPhotos.push(await uploadIncidentPhoto(entry.localPhotos[index]));
        await checkpoint(entry);
      }
      if (entry.localPhotos.length) {
        if (!isRangerIncidentOnline()) throw new Error('Waiting for connectivity.');
        await runTransaction(db, async transaction => {
          const existing = await transaction.get(reference);
          if (!existing.exists()) throw new Error('The incident could not be found on the server.');
          transaction.update(reference, { photoUris: entry.uploadedPhotos, updatedAt: Timestamp.now() });
        });
      }
      entry.syncStatus = 'synced';
      entry.syncedAt = new Date().toISOString();
      await checkpoint(entry);
    } catch (error) {
      entry.syncStatus = isRangerIncidentOnline() ? 'failed' : 'waiting';
      entry.error = error instanceof Error ? error.message : 'Sync failed. Your report remains saved on this device.';
      await checkpoint(entry);
    }
  }
}

export function syncRangerIncidents(): Promise<void> {
  if (syncing) {
    resyncRequested = true;
    return syncing;
  }
  syncing = runSync().finally(() => {
    syncing = undefined;
    if (resyncRequested) {
      resyncRequested = false;
      void syncRangerIncidents().catch(() => undefined);
    }
  });
  return syncing;
}
