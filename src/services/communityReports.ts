import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getIncidentReporter } from './incidentReporter';
import { uploadIncidentPhoto } from './cloudinary';
import { retainCommunityPhoto } from './communityPhoto';
import { COMMUNITY_REPORT_KINDS, COMMUNITY_REPORT_TYPES, COMMUNITY_SMS_KEYWORDS, CommunityInput, CommunityReport, QueuedCommunityReport } from '../types/community';
import { IncidentStatus } from '../types/incident';
import { STORAGE_KEYS } from '../storage/keys';
import { StaffUser } from '../types/user';

const DEMO_RESPONSES_KEY = '@wildtrail_demo_community_responses_v1';
const demoListeners = new Set<() => void>();
type DemoResponse = Pick<CommunityReport, 'assignedTo' | 'assignedName' | 'status' | 'responseNotes'> & { demoAcceptance: true };
async function demoOfficer(): Promise<StaffUser | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  const profile: StaffUser | null = raw ? JSON.parse(raw) : null;
  if (auth.currentUser && !auth.currentUser.isAnonymous) return null;
  return profile?.accountStatus === 'ACTIVE'
    && ((profile.uid === 'usr-ranger-204' && profile.role === 'ranger' && profile.email === 'nimal@wildguard.org')
      || (profile.uid === 'usr-liaison-305' && profile.role === 'liaison' && profile.email === 'liaison@wildguard.org')) ? profile : null;
}
async function readDemoResponses(): Promise<Record<string, DemoResponse>> {
  const raw = await AsyncStorage.getItem(DEMO_RESPONSES_KEY);
  return raw ? JSON.parse(raw) : {};
}

// Firestore creates this collection when the first report is delivered.
export const COMMUNITY_REPORTS_COLLECTION = 'communityReports';

const KEY = '@wildtrail_community_queue_v1';
let storageLock: Promise<unknown> = Promise.resolve();
let syncing: Promise<void> | undefined;

function locked<T>(work: () => Promise<T>): Promise<T> {
  const result = storageLock.then(work, work);
  storageLock = result.catch(() => undefined);
  return result;
}

async function readQueue(): Promise<QueuedCommunityReport[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

async function checkpoint(report: QueuedCommunityReport) {
  await locked(async () => {
    const queue = await readQueue();
    const index = queue.findIndex((entry) => entry.id === report.id);
    if (index >= 0) queue[index] = report;
    await AsyncStorage.setItem(KEY, JSON.stringify(queue));
  });
}

export function getCommunityQueue() { return locked(readQueue); }

export function validateCommunityInput(input: CommunityInput) {
  if (!COMMUNITY_REPORT_KINDS.includes(input.kind)) throw new Error('Choose an incident type.');
  for (const value of [input.village, input.boundarySection, input.landmark, input.description]) {
    if (!value.trim()) throw new Error('Enter the village, boundary section, landmark and description.');
  }
  if (!Number.isFinite(Date.parse(input.occurredAt))) throw new Error('Enter a valid event date and time.');
}

export function parseCommunitySms(body: string, phone: string): CommunityInput {
  const parts = body.split('|').map((part) => part.trim());
  const [keyword, village, boundarySection, landmark, description] = parts;
  const kind = COMMUNITY_REPORT_KINDS.find((value) => COMMUNITY_REPORT_TYPES[value].keyword === keyword.toUpperCase());
  if (parts.length !== 5 || !kind) {
    throw new Error(`Use a keyword (${COMMUNITY_SMS_KEYWORDS}) | village | boundary section | landmark | description`);
  }
  const input: CommunityInput = {
    kind,
    village, boundarySection, landmark, description, contactPhone: phone.trim(),
    occurredAt: new Date().toISOString(), source: 'sms_simulated',
  };
  validateCommunityInput(input);
  return input;
}

export async function queueCommunityReport(input: CommunityInput, photos: string[]) {
  validateCommunityInput(input);
  const id = doc(collection(db, COMMUNITY_REPORTS_COLLECTION)).id;
  const localPhotos: string[] = [];
  for (const [index, uri] of photos.entries()) localPhotos.push(await retainCommunityPhoto(uri, id, index));
  const entry: QueuedCommunityReport = {
    id, collection: COMMUNITY_REPORTS_COLLECTION, input, localPhotos, uploadedPhotos: [], received: false, complete: false,
    ...(auth.currentUser ? { ownerUid: auth.currentUser.uid } : {}),
  };
  await locked(async () => {
    const queue = await readQueue();
    queue.push(entry);
    await AsyncStorage.setItem(KEY, JSON.stringify(queue));
  });
  return entry;
}

export function syncCommunityReports(): Promise<void> {
  if (syncing) return syncing;
  syncing = (async () => {
    const queue = await getCommunityQueue();
    if (!queue.some((entry) => !entry.complete)) return;
    const user = await getIncidentReporter();
    for (const entry of queue) {
      if (entry.complete || (entry.ownerUid && entry.ownerUid !== user.uid)) continue;
      entry.ownerUid = user.uid;
      delete entry.error;
      await checkpoint(entry);
      try {
        // Finish uploads for reports received before the collection change.
        const reportCollection = entry.collection ?? (entry.received ? 'incidents' : COMMUNITY_REPORTS_COLLECTION);
        entry.collection = reportCollection;
        await checkpoint(entry);
        const reference = doc(db, reportCollection, entry.id);
        if (!entry.received) {
          // Stable document IDs and a transaction prevent duplicate reports on retry.
          await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(reference);
            if (!existing.exists()) transaction.set(reference, {
              ...entry.input, reporterType: 'community', reporterId: user.uid,
              title: COMMUNITY_REPORT_TYPES[entry.input.kind].label,
              category: COMMUNITY_REPORT_TYPES[entry.input.kind].category,
              location: { address: `${entry.input.village}, ${entry.input.boundarySection}: ${entry.input.landmark}` },
              severity: 'medium', status: 'pending', assignedTo: '', responseNotes: '', photoUris: [],
              createdAt: serverTimestamp(), updatedAt: serverTimestamp(), receivedAt: serverTimestamp(),
            });
          });
          entry.received = true;
          await checkpoint(entry);
        }
        for (let index = entry.uploadedPhotos.length; index < entry.localPhotos.length; index++) {
          entry.uploadedPhotos.push(await uploadIncidentPhoto(entry.localPhotos[index]));
          await checkpoint(entry);
          await updateDoc(reference, { photoUris: entry.uploadedPhotos, updatedAt: serverTimestamp() });
        }
        // Also repairs a failed link update without uploading the photo again.
        if (entry.uploadedPhotos.length) await updateDoc(reference, { photoUris: entry.uploadedPhotos, updatedAt: serverTimestamp() });
        entry.complete = true;
        await checkpoint(entry);
      } catch (error) {
        entry.error = error instanceof Error ? error.message : 'Waiting for connection.';
        await checkpoint(entry);
      }
    }
  })().finally(() => { syncing = undefined; });
  return syncing;
}

export function watchCommunityReports(onReports: (reports: CommunityReport[]) => void, onError: (error: Error) => void) {
  let reports: CommunityReport[] = [];
  let active = true;
  const publish = () => { void demoOfficer().then(async (officer) => {
    const overlays = officer ? await readDemoResponses() : {};
    if (active) onReports(reports.map((report) => report.assignedTo ? report : { ...report, ...overlays[report.id] }));
  }).catch(onError); };
  demoListeners.add(publish);
  const unsubscribe = onSnapshot(query(collection(db, COMMUNITY_REPORTS_COLLECTION), where('reporterType', '==', 'community')), (snapshot) => {
    reports = snapshot.docs.map((record) => {
      const data = record.data();
      const date = (value: any) => value?.toDate?.().toISOString() ?? '';
      return { ...data, id: record.id, createdAt: date(data.createdAt), receivedAt: date(data.receivedAt) } as CommunityReport;
    });
    reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    publish();
  }, onError);
  return () => { active = false; demoListeners.delete(publish); unsubscribe(); };
}

export async function acceptCommunityOperation(id: string) {
  await auth.authStateReady();
  const demo = await demoOfficer();
  if (demo) {
    const snapshot = await getDoc(doc(db, COMMUNITY_REPORTS_COLLECTION, id));
    const report = snapshot.data();
    if (!report || report.reporterType !== 'community') throw new Error('Community report not found.');
    if (report.assignedTo || report.status !== 'pending') throw new Error('This operation is no longer available.');
    await locked(async () => {
      const responses = await readDemoResponses();
      if (responses[id]) throw new Error('This operation has already been accepted on this device.');
      responses[id] = { assignedTo: demo.uid, assignedName: demo.name, status: 'investigating', responseNotes: report.responseNotes || '', demoAcceptance: true };
      await AsyncStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(responses));
    });
    demoListeners.forEach((notify) => notify());
    return;
  }
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in as a ranger or liaison to accept this operation.');
  const profile = (await getDoc(doc(db, 'users', user.uid))).data();
  const token = await user.getIdTokenResult();
  const role = profile?.accountStatus === 'ACTIVE' ? profile.role : token.claims.role;
  if (!['ranger', 'liaison'].includes(role)) throw new Error('Only rangers and liaison officers can accept operations.');
  await runTransaction(db, async (transaction) => {
    const reference = doc(db, COMMUNITY_REPORTS_COLLECTION, id);
    const snapshot = await transaction.get(reference);
    const report = snapshot.data();
    if (!report || report.reporterType !== 'community') throw new Error('Community report not found.');
    if (report.assignedTo) throw new Error('This operation has already been accepted.');
    if (report.status !== 'pending') throw new Error('Only pending operations can be accepted.');
    transaction.update(reference, { assignedTo: user.uid, assignedName: profile?.name || user.displayName || user.email || user.uid, status: 'investigating', updatedAt: serverTimestamp() });
  });
}

export async function respondToCommunityReport(id: string, status: IncidentStatus, responseNotes: string) {
  const demo = await demoOfficer();
  if (demo) {
    await locked(async () => {
      const responses = await readDemoResponses();
      if (!responses[id] || responses[id].assignedTo !== demo.uid) throw new Error('Accept this operation with this demo account before saving a response.');
      responses[id] = { ...responses[id], status, responseNotes: responseNotes.trim() };
      await AsyncStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(responses));
    });
    demoListeners.forEach((notify) => notify());
    return;
  }
  await updateDoc(doc(db, COMMUNITY_REPORTS_COLLECTION, id), { status, responseNotes: responseNotes.trim(), updatedAt: serverTimestamp() });
}
