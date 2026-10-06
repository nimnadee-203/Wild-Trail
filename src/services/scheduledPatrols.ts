import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from './firebase';
import { ScheduledPatrol, ScheduledPatrolInput } from '../types/patrol';

const scheduledPatrolsCollection = collection(db, 'assignedPatrols');
const FIRESTORE_WRITE_TIMEOUT_MS = 15000;

function withFirestoreTimeout<T>(operation: Promise<T>): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore did not respond within 15 seconds. Make sure Cloud Firestore is enabled for the WildTrail project and try again.')), FIRESTORE_WRITE_TIMEOUT_MS);
    }),
  ]);
}

export function getScheduledPatrolErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return 'Firestore denied this write. Update the Firestore security rules to allow signed-in managers to write assignedPatrols.';
    }
    if (error.code === 'failed-precondition' || error.code === 'not-found') {
      return 'Cloud Firestore is not enabled for this Firebase project. In Firebase Console, open Firestore Database, click “Create database”, and try again.';
    }
    if (error.code === 'unavailable') {
      return 'Firestore is unavailable. Check your internet connection and make sure the Firestore database has been created.';
    }
  }
  return error instanceof Error ? error.message : 'Unable to save the patrol. Please try again.';
}

function mapScheduledPatrol(document: DocumentData & { id: string }): ScheduledPatrol {
  const data = document as DocumentData;
  return {
    id: document.id,
    teamName: String(data.teamName ?? ''),
    rangerName: String(data.rangerName ?? ''),
    zone: String(data.zone ?? ''),
    date: String(data.date ?? ''),
    startTime: String(data.startTime ?? ''),
    endTime: data.endTime ? String(data.endTime) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    status: data.status ?? 'scheduled',
    createdAt: data.createdAt?.toDate?.()?.toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
  };
}

export function subscribeToScheduledPatrols(
  onChange: (patrols: ScheduledPatrol[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const patrolsQuery = query(scheduledPatrolsCollection, orderBy('date', 'asc'));
  return onSnapshot(
    patrolsQuery,
    (snapshot) => onChange(snapshot.docs.map((item) => mapScheduledPatrol({ id: item.id, ...item.data() }))),
    (error) => onError(error)
  );
}

export async function createScheduledPatrol(input: ScheduledPatrolInput): Promise<string> {
  const document = await withFirestoreTimeout(addDoc(scheduledPatrolsCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  return document.id;
}

export async function updateScheduledPatrol(id: string, input: ScheduledPatrolInput): Promise<void> {
  await withFirestoreTimeout(updateDoc(doc(db, 'assignedPatrols', id), {
    ...input,
    updatedAt: serverTimestamp(),
  }));
}
