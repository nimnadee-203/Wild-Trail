import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { DEFAULT_INCIDENT_RANGER, getIncidentReporter } from '../incidentReporter';
import { readIncidentPhoto } from '../incidentPhoto';
import { apiFetch, ApiResponse } from './client';
import { ConflictReport, IncidentCategory, IncidentReport, LocationData } from '../../types/incident';

export interface CreateIncidentInput {
  category: IncidentCategory;
  title: string;
  description: string;
  location: LocationData;
  photoUris?: string[];
}

export interface CreateIncidentResult extends IncidentReport {
  photoWarning?: string;
}

function describePhotoError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : undefined;
  switch (code) {
    case 'storage/unauthorized':
      return 'Photo storage denied access (storage/unauthorized). Check the deployed Storage rules.';
    case 'storage/bucket-not-found':
    case 'storage/no-default-bucket':
      return `Photo storage is not configured (${code}). Check the Firebase Storage bucket.`;
    case 'storage/quota-exceeded':
      return 'Photo storage quota was exceeded (storage/quota-exceeded). Check Firebase billing and quota.';
    default:
      return `${code ? `${code}: ` : ''}${error instanceof Error ? error.message : 'Unable to upload a photo.'}`;
  }
}

function requireReporterId() {
  const reporterId = auth.currentUser?.uid;
  if (!reporterId) {
    throw new Error('You must be signed in to report an incident.');
  }
  return reporterId;
}

async function hasManagerAccess() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to view incidents.');
  }

  const token = await user.getIdTokenResult();
  return token.claims.role === 'manager' || token.claims.role === 'admin';
}

function toIsoDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : new Date().toISOString();
}

async function uploadIncidentPhoto(reporterId: string, incidentId: string, uri: string, index: number) {
  const { data, contentType, size } = await readIncidentPhoto(uri);
  if (size === 0) {
    throw new Error(`Incident photo ${index + 1} is empty. Please take it again.`);
  }
  if (size >= 10 * 1024 * 1024) {
    throw new Error(`Incident photo ${index + 1} must be smaller than 10 MB.`);
  }

  const photoRef = ref(storage, `incidents/${reporterId}/${incidentId}/${index}`);
  await uploadBytes(photoRef, data, { contentType });
  return getDownloadURL(photoRef);
}

export async function createIncident(input: CreateIncidentInput): Promise<CreateIncidentResult> {
  const description = input.description.trim();
  if (!description) {
    throw new Error('A description is required.');
  }

  const reporter = await getIncidentReporter();
  const reporterId = reporter.uid;
  const reporterDetails = reporter.isAnonymous
    ? {
        reporterName: DEFAULT_INCIDENT_RANGER.name,
        reporterBadgeNumber: DEFAULT_INCIDENT_RANGER.badgeNumber,
      }
    : {};

  const incidentRef = await addDoc(collection(db, 'incidents'), {
    reporterId,
    ...reporterDetails,
    category: input.category,
    severity: 'medium',
    status: 'pending',
    title: input.title.trim(),
    description,
    location: input.location,
    photoUris: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const photoUris: string[] = [];
  const photoErrors: string[] = [];
  // Process photos one at a time to limit memory usage on mobile.
  for (const [index, uri] of (input.photoUris ?? []).entries()) {
    try {
      photoUris.push(await uploadIncidentPhoto(reporterId, incidentRef.id, uri, index));
    } catch (error) {
      console.error(`Incident ${incidentRef.id}, photo ${index + 1} upload failed:`, error);
      photoErrors.push(describePhotoError(error));
    }
  }

  let savedPhotoUris: string[] = [];
  if (photoUris.length > 0) {
    try {
      await updateDoc(incidentRef, { photoUris, updatedAt: Timestamp.now() });
      savedPhotoUris = photoUris;
    } catch (error) {
      console.error(`Incident ${incidentRef.id} photo link update failed:`, error);
      photoErrors.push('Photos uploaded, but their links could not be saved to the incident.');
    }
  }

  return {
    id: incidentRef.id,
    reporterId,
    ...reporterDetails,
    category: input.category,
    severity: 'medium',
    status: 'pending',
    title: input.title.trim(),
    description,
    location: input.location,
    photoUris: savedPhotoUris,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(photoErrors.length > 0
      ? {
          photoWarning: `Incident saved. ${savedPhotoUris.length} of ${input.photoUris?.length ?? 0} photos attached. ${[...new Set(photoErrors)].join(' ')}`,
        }
      : {}),
  };
}

export async function getFirebaseIncidents(): Promise<IncidentReport[]> {
  const reporterId = requireReporterId();
  const canViewAll = await hasManagerAccess();
  const incidentsQuery = canViewAll
    ? query(collection(db, 'incidents'), orderBy('createdAt', 'desc'))
    : query(
        collection(db, 'incidents'),
        where('reporterId', '==', reporterId),
        orderBy('createdAt', 'desc')
      );
  const snapshot = await getDocs(incidentsQuery);

  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      ...data,
      createdAt: toIsoDate(data.createdAt),
      updatedAt: toIsoDate(data.updatedAt),
    } as IncidentReport;
  });
}

export const incidentApiService = {
  async getIncidents(): Promise<ApiResponse<IncidentReport[]>> {
    return apiFetch<IncidentReport[]>('/incidents');
  },

  async createIncidentReport(
    payload: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<ApiResponse<IncidentReport>> {
    return apiFetch<IncidentReport>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createConflictReport(
    payload: Omit<ConflictReport, 'id' | 'createdAt' | 'status'>
  ): Promise<ApiResponse<ConflictReport>> {
    return apiFetch<ConflictReport>('/conflicts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getConflictHistory(reporterId?: string): Promise<ApiResponse<ConflictReport[]>> {
    const query = reporterId ? `?reporterId=${reporterId}` : '';
    return apiFetch<ConflictReport[]>(`/conflicts${query}`);
  },
};
