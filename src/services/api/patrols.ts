import { collection, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { apiFetch, ApiResponse } from './client';
import {
  PatrolLog,
  GPSCoordinate,
  AssignedPatrol,
  ActivePatrolSession,
  RangerStatus,
  ActualPathPoint,
  ScheduledPatrol,
  MarkedWaypoint,
  PatrolObservation,
  CompletedPatrolSummary,
} from '../../types/patrol';
import { storageService } from '../../storage/asyncStorage';
import { STORAGE_KEYS } from '../../storage/keys';

export function calculateRouteDistance(route: [number, number][]): number {
  if (!route || route.length < 2) return 4.8;
  let totalKm = 0;
  for (let i = 1; i < route.length; i++) {
    const lon1 = route[i - 1][0];
    const lat1 = route[i - 1][1];
    const lon2 = route[i][0];
    const lat2 = route[i][1];
    const R = 6371; // earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }
  return parseFloat(totalKm.toFixed(2)) || 4.8;
}

export const MOCK_ASSIGNED_PATROLS: AssignedPatrol[] = [
  {
    id: 'PAT-0156',
    name: 'Northern Boundary Patrol',
    park: 'Yala National Park',
    date: '2026-10-08',
    startTime: '08:00',
    duration: 4,
    priority: 'HIGH',
    status: 'ASSIGNED',
    plannedDistanceKm: 4.8,
    instructions: 'Check northern boundary, fence integrity, and water points for anti-poaching activity.',
    route: [
      [81.503, 6.3672],
      [81.5044, 6.3681],
      [81.5057, 6.3695],
    ],
  },
  {
    id: 'PAT-0157',
    name: 'River Corridor Patrol',
    park: 'Yala National Park',
    date: '2026-10-08',
    startTime: '14:00',
    duration: 3,
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    plannedDistanceKm: 3.6,
    instructions: 'Monitor river bank wildlife crossing corridor and survey waterhole Zone C.',
    route: [
      [81.512, 6.371],
      [81.514, 6.3735],
      [81.5165, 6.376],
    ],
  },
  {
    id: 'PAT-0158',
    name: 'Coastal Dune Sector Patrol',
    park: 'Yala National Park',
    date: '2026-10-09',
    startTime: '06:00',
    duration: 5,
    priority: 'LOW',
    status: 'ASSIGNED',
    plannedDistanceKm: 5.2,
    instructions: 'Inspect coastal perimeter, verify camera trap operations, and report any encroachment.',
    route: [
      [81.52, 6.38],
      [81.5225, 6.382],
      [81.525, 6.385],
    ],
  },
];

let inMemoryAssignedPatrols = [...MOCK_ASSIGNED_PATROLS];

export function mapScheduledToAssignedPatrol(sp: ScheduledPatrol): AssignedPatrol {
  let mappedStatus: AssignedPatrol['status'] = 'ASSIGNED';
  if (sp.status === 'on patrol') mappedStatus = 'IN_PROGRESS';
  else if (sp.status === 'completed') mappedStatus = 'COMPLETED';
  else if (sp.status === 'cancelled') mappedStatus = 'CANCELLED';

  const routeTuples: [number, number][] = (sp.route || []).map((pt) => [pt.longitude, pt.latitude]);

  return {
    id: sp.id,
    name: sp.teamName || 'Patrol Assignment',
    park: sp.zone || 'Yala National Park',
    date: sp.date || new Date().toISOString().split('T')[0],
    startTime: sp.startTime || '08:00',
    duration: 4,
    priority: 'HIGH',
    status: mappedStatus,
    instructions: sp.notes || 'Proceed along assigned sector checkpoints and verify boundary integrity.',
    route: routeTuples.length > 0 ? routeTuples : [[81.503, 6.3672], [81.5044, 6.3681], [81.5057, 6.3695]],
  };
}

export const patrolApiService = {
  async getRangerAssignedPatrols(rangerId: string = 'R001'): Promise<ApiResponse<AssignedPatrol[]>> {
    const completedMap = new Map<string, CompletedPatrolSummary>();
    try {
      const history = await storageService.getItem<CompletedPatrolSummary[]>(STORAGE_KEYS.COMPLETED_PATROLS);
      if (history && history.length > 0) {
        history.forEach((c) => completedMap.set(c.patrolId, c));
      }
    } catch {
      // Ignore
    }

    // Sync inMemoryAssignedPatrols with completed history
    inMemoryAssignedPatrols = inMemoryAssignedPatrols.map((item) => {
      const completedInfo = completedMap.get(item.id);
      if (completedInfo) {
        return {
          ...item,
          status: 'COMPLETED' as const,
          plannedDistanceKm: completedInfo.plannedDistanceKm || item.plannedDistanceKm || calculateRouteDistance(item.route),
          completionPercentage: completedInfo.completionPercentage ?? 100,
          completedDistanceKm: completedInfo.distanceKm,
        };
      }
      return {
        ...item,
        plannedDistanceKm: item.plannedDistanceKm || calculateRouteDistance(item.route),
      };
    });

    try {
      const q = query(collection(db, 'assignedPatrols'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestorePatrols = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const sp: ScheduledPatrol = {
            id: docSnap.id,
            teamName: data.teamName || '',
            rangerName: data.rangerName || '',
            rangerId: data.rangerId || undefined,
            zone: data.zone || '',
            date: data.date || '',
            startTime: data.startTime || '',
            endTime: data.endTime || undefined,
            notes: data.notes || undefined,
            status: data.status || 'scheduled',
            route: data.route || [],
            checkpoints: data.checkpoints || [],
          };
          const mapped = mapScheduledToAssignedPatrol(sp);
          const completedInfo = completedMap.get(mapped.id);
          if (completedInfo) {
            mapped.status = 'COMPLETED';
            mapped.plannedDistanceKm = completedInfo.plannedDistanceKm || mapped.plannedDistanceKm;
            mapped.completionPercentage = completedInfo.completionPercentage ?? 100;
            mapped.completedDistanceKm = completedInfo.distanceKm;
          }
          return mapped;
        });
        if (firestorePatrols.length > 0) {
          return { data: firestorePatrols, error: null, status: 200 };
        }
      }
    } catch {
      // Fall back to in-memory mock data
    }
    return {
      data: inMemoryAssignedPatrols,
      error: null,
      status: 200,
    };
  },

  async startPatrolSession(patrol: AssignedPatrol): Promise<ActivePatrolSession> {
    const now = new Date();
    const formattedStartTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update patrol status: ASSIGNED -> IN_PROGRESS
    inMemoryAssignedPatrols = inMemoryAssignedPatrols.map((item) =>
      item.id === patrol.id ? { ...item, status: 'IN_PROGRESS' as const } : item
    );

    try {
      const patrolRef = doc(db, 'assignedPatrols', patrol.id);
      await updateDoc(patrolRef, { status: 'on patrol' });
    } catch {
      // Ignore fallback if offline or mock
    }

    const initialPoint: ActualPathPoint = {
      latitude: patrol.route[0] ? patrol.route[0][1] : 6.3672,
      longitude: patrol.route[0] ? patrol.route[0][0] : 81.503,
      timestamp: formattedStartTime,
    };

    // 2. Create Active Patrol Session (Ranger Status: ON_PATROL) with initial actualPath point
    const session: ActivePatrolSession = {
      sessionId: `SESS-${Date.now()}`,
      patrolId: patrol.id,
      patrolName: patrol.name,
      park: patrol.park,
      priority: patrol.priority,
      patrolStatus: 'IN_PROGRESS',
      rangerStatus: 'ON_PATROL',
      startTime: formattedStartTime,
      startTimestamp: now.getTime(),
      routeCoords: patrol.route,
      pointCount: 1,
      actualPath: [initialPoint],
      markedWaypoints: [],
      observations: [],
    };

    await storageService.setItem(STORAGE_KEYS.ACTIVE_PATROL, session);
    await storageService.setItem(STORAGE_KEYS.RANGER_STATUS, 'ON_PATROL' as RangerStatus);
    return session;
  },

  async setRangerStatus(status: RangerStatus): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.RANGER_STATUS, status);
    const session = await storageService.getItem<ActivePatrolSession>(STORAGE_KEYS.ACTIVE_PATROL);
    if (session) {
      await storageService.setItem(STORAGE_KEYS.ACTIVE_PATROL, {
        ...session,
        rangerStatus: status,
      });
    }
  },

  async getRangerStatus(): Promise<RangerStatus> {
    const status = await storageService.getItem<RangerStatus>(STORAGE_KEYS.RANGER_STATUS);
    if (status) return status;
    const session = await storageService.getItem<ActivePatrolSession>(STORAGE_KEYS.ACTIVE_PATROL);
    if (session) return session.rangerStatus;
    return 'AVAILABLE';
  },

  async addActualPathPoint(point: ActualPathPoint): Promise<ActivePatrolSession | null> {
    const session = await storageService.getItem<ActivePatrolSession>(STORAGE_KEYS.ACTIVE_PATROL);
    if (!session) return null;

    const updatedPath = [...(session.actualPath || []), point];
    const updatedSession: ActivePatrolSession = {
      ...session,
      actualPath: updatedPath,
      pointCount: updatedPath.length,
    };

    await storageService.setItem(STORAGE_KEYS.ACTIVE_PATROL, updatedSession);
    return updatedSession;
  },

  async addMarkedWaypoint(waypoint: MarkedWaypoint): Promise<ActivePatrolSession | null> {
    const session = await storageService.getItem<ActivePatrolSession>(STORAGE_KEYS.ACTIVE_PATROL);
    if (!session) return null;

    const updatedWaypoints = [...(session.markedWaypoints || []), waypoint];
    const updatedSession: ActivePatrolSession = {
      ...session,
      markedWaypoints: updatedWaypoints,
    };

    await storageService.setItem(STORAGE_KEYS.ACTIVE_PATROL, updatedSession);
    return updatedSession;
  },

  async addPatrolObservation(observation: PatrolObservation): Promise<ActivePatrolSession | null> {
    const session = await storageService.getItem<ActivePatrolSession>(STORAGE_KEYS.ACTIVE_PATROL);
    if (!session) return null;

    const updatedObservations = [...(session.observations || []), observation];
    const updatedSession: ActivePatrolSession = {
      ...session,
      observations: updatedObservations,
    };

    await storageService.setItem(STORAGE_KEYS.ACTIVE_PATROL, updatedSession);
    return updatedSession;
  },

  async getActivePatrolSession(): Promise<ActivePatrolSession | null> {
    return storageService.getItem<ActivePatrolSession>(STORAGE_KEYS.ACTIVE_PATROL);
  },

  async completePatrolSession(
    patrolId: string,
    summaryInput: {
      patrolName: string;
      park: string;
      priority: string;
      startTime: string;
      endTime: string;
      distanceKm: number;
      plannedDistanceKm?: number;
      actualPath: ActualPathPoint[];
      markedWaypoints: MarkedWaypoint[];
      observations: PatrolObservation[];
    }
  ): Promise<CompletedPatrolSummary> {
    const plannedDist = summaryInput.plannedDistanceKm || 4.8;
    const completionPct = Math.min(100, Math.max(1, Math.round((summaryInput.distanceKm / plannedDist) * 100)));

    const summary: CompletedPatrolSummary = {
      patrolId,
      ...summaryInput,
      plannedDistanceKm: plannedDist,
      completionPercentage: completionPct,
      patrolStatus: 'COMPLETED',
      rangerStatus: 'AVAILABLE',
      completedAt: new Date().toISOString(),
    };

    // 1. Update patrol status in mock data: IN_PROGRESS -> COMPLETED
    inMemoryAssignedPatrols = inMemoryAssignedPatrols.map((item) =>
      item.id === patrolId
        ? {
            ...item,
            status: 'COMPLETED' as const,
            completedDistanceKm: summaryInput.distanceKm,
            plannedDistanceKm: plannedDist,
            completionPercentage: completionPct,
          }
        : item
    );

    // 2. Save complete log into Firestore if doc exists
    try {
      const patrolRef = doc(db, 'assignedPatrols', patrolId);
      await updateDoc(patrolRef, {
        status: 'completed',
        endTime: summary.endTime,
        distanceKm: summary.distanceKm,
        actualPath: summary.actualPath,
        markedWaypoints: summary.markedWaypoints,
        observations: summary.observations,
        updatedAt: summary.completedAt,
      });
    } catch {
      // Ignore fallback if offline or mock
    }

    // 3. Save completed summary into storage history
    try {
      const history = (await storageService.getItem<CompletedPatrolSummary[]>(STORAGE_KEYS.COMPLETED_PATROLS)) || [];
      await storageService.setItem(STORAGE_KEYS.COMPLETED_PATROLS, [summary, ...history]);
    } catch {
      // Ignore fallback
    }

    // 4. Clear Active Patrol Session & Return Ranger Status to AVAILABLE
    await storageService.removeItem(STORAGE_KEYS.ACTIVE_PATROL);
    await storageService.setItem(STORAGE_KEYS.RANGER_STATUS, 'AVAILABLE' as RangerStatus);

    return summary;
  },

  async endPatrolSession(patrolId: string): Promise<RangerStatus> {
    // 1. Update patrol status: IN_PROGRESS -> COMPLETED
    inMemoryAssignedPatrols = inMemoryAssignedPatrols.map((item) =>
      item.id === patrolId ? { ...item, status: 'COMPLETED' as const } : item
    );

    try {
      const patrolRef = doc(db, 'assignedPatrols', patrolId);
      await updateDoc(patrolRef, { status: 'completed' });
    } catch {
      // Ignore fallback if offline or mock
    }

    // 2. Clear Active Patrol Session & Return Ranger Status to AVAILABLE
    await storageService.removeItem(STORAGE_KEYS.ACTIVE_PATROL);
    await storageService.setItem(STORAGE_KEYS.RANGER_STATUS, 'AVAILABLE' as RangerStatus);
    return 'AVAILABLE';
  },

  async startPatrol(rangerId: string): Promise<ApiResponse<PatrolLog>> {
    return apiFetch<PatrolLog>('/patrols/start', {
      method: 'POST',
      body: JSON.stringify({ rangerId }),
    });
  },

  async updatePatrolLocation(
    patrolId: string,
    coordinate: GPSCoordinate
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(`/patrols/${patrolId}/location`, {
      method: 'POST',
      body: JSON.stringify(coordinate),
    });
  },

  async endPatrol(patrolId: string, notes?: string): Promise<ApiResponse<PatrolLog>> {
    return apiFetch<PatrolLog>(`/patrols/${patrolId}/end`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};


