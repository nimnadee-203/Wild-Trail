import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export type ManagerAlertSeverity = 'High' | 'Medium' | 'Low';
export type ManagerAlertStatus = 'Active' | 'Assigned' | 'Resolved';

export interface ManagerAlert {
  firestoreId: string;
  id: string;
  title: string;
  zone: string;
  time: string;
  severity: ManagerAlertSeverity;
  status: ManagerAlertStatus;
}

function formatAlertTime(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return 'Time unavailable';
}

function mapSeverity(value: unknown): ManagerAlertSeverity {
  const severity = String(value ?? '').toUpperCase();
  if (severity === 'HIGH') return 'High';
  if (severity === 'MEDIUM') return 'Medium';
  return 'Low';
}

function mapStatus(value: unknown): ManagerAlertStatus {
  const status = String(value ?? '').toUpperCase();
  if (status === 'RESPONDED' || status === 'RESOLVED') return 'Resolved';
  if (status === 'ACKNOWLEDGED' || status === 'ASSIGNED') return 'Assigned';
  return 'Active';
}

function mapManagerAlert(id: string, data: DocumentData): ManagerAlert {
  const species = String(data.species ?? 'Wildlife');
  const animalId = String(data.animalId ?? id);

  return {
    firestoreId: id,
    id: animalId,
    title: String(data.title ?? `${species} risk alert`),
    zone: String(data.location ?? 'Location unavailable'),
    time: formatAlertTime(data.timestamp),
    severity: mapSeverity(data.level),
    status: mapStatus(data.status),
  };
}

export function subscribeToManagerAlerts(
  onChange: (alerts: ManagerAlert[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'alerts'),
    (snapshot) => {
      const alerts = snapshot.docs
        .map((item) => mapManagerAlert(item.id, item.data()))
        .sort((left, right) => right.time.localeCompare(left.time));
      onChange(alerts);
    },
    onError
  );
}

export async function resolveManagerAlert(id: string): Promise<void> {
  await updateDoc(doc(db, 'alerts', id), { status: 'RESPONDED' });
}
