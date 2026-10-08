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
import { db } from '../firebase';
import { DEFAULT_INCIDENT_RANGER, getIncidentReporter } from '../incidentReporter';
import { uploadIncidentPhoto } from '../cloudinary';
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
  return error instanceof Error ? error.message : 'Unable to upload a photo.';
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
      photoUris.push(await uploadIncidentPhoto(uri));
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

export async function getRangerIncidents(): Promise<IncidentReport[]> {
  const reporter = await getIncidentReporter();
  const snapshot = await getDocs(
    query(collection(db, 'incidents'), where('reporterId', '==', reporter.uid))
  );
  // Sort locally so this personal history does not require a composite index.
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      ...data,
      id: document.id,
      createdAt: toIsoDate(data.createdAt),
      updatedAt: toIsoDate(data.updatedAt),
    } as IncidentReport;
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getFirebaseIncidents(): Promise<IncidentReport[]> {
  await getIncidentReporter();
  // This manager query must be authorized by Firestore rules. Never silently
  // substitute a ranger-only list when the session lacks manager access.
  const incidentsQuery = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
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
