export type PatrolStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number | null;
  heading?: number | null;
}

export interface PatrolLog {
  id: string;
  rangerId: string;
  status: PatrolStatus;
  startTime: string;
  endTime?: string;
  distanceKm: number;
  pathCoordinates: GPSCoordinate[];
  incidentsReportedIds: string[];
  notes?: string;
}

export type ScheduledPatrolStatus = 'scheduled' | 'on patrol' | 'completed' | 'cancelled';

export interface PatrolMapPoint {
  latitude: number;
  longitude: number;
}

export interface PatrolCheckpoint extends PatrolMapPoint {
  id: string;
  label: string;
}

export interface ScheduledPatrol {
  id: string;
  teamName: string;
  rangerName: string;
  rangerId?: string;
  zone: string;
  date: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  status: ScheduledPatrolStatus;
  route: PatrolMapPoint[];
  checkpoints: PatrolCheckpoint[];
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduledPatrolInput = Omit<ScheduledPatrol, 'id' | 'createdAt' | 'updatedAt'>;

export type RangerStatus = 'AVAILABLE' | 'ON_PATROL' | 'OFF_DUTY' | 'RESPONDING_TO_ALERT';

export interface AssignedPatrol {
  id: string;
  name: string;
  park: string;
  date: string;
  startTime: string;
  duration: number; // in hours
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  instructions: string;
  route: [number, number][]; // Array of [longitude, latitude] tuples
}

export interface ActualPathPoint {
  latitude: number;
  longitude: number;
  timestamp: string; // e.g. "08:02"
  syncStatus?: 'PENDING_SYNC' | 'SUBMITTED';
}

export type WaypointType =
  | 'OBSERVATION'
  | 'SIGHTING'
  | 'WATER_POINT'
  | 'PERIMETER_CHECK'
  | 'POACHING_TRAIL'
  | 'FENCE_BREACH'
  | 'GENERAL';

export interface MarkedWaypoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string; // e.g. "08:05 PM"
  timestampMs: number;
  type: WaypointType;
  notes?: string;
  syncStatus?: 'PENDING_SYNC' | 'SUBMITTED';
}

export type ObservationType =
  | 'Wildlife Sighting'
  | 'Illegal Activity'
  | 'Habitat Condition'
  | 'Fence Damage'
  | 'Water Source'
  | 'Other';

export interface PatrolObservation {
  id: string;
  patrolId?: string;
  patrolName?: string;
  park?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  type: ObservationType;
  description: string;
  syncStatus?: 'PENDING_SYNC' | 'SUBMITTED';
}

export interface ActivePatrolSession {
  sessionId: string;
  patrolId: string;
  patrolName: string;
  park: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  patrolStatus: 'IN_PROGRESS' | 'COMPLETED';
  rangerStatus: RangerStatus;
  startTime: string;
  startTimestamp: number;
  routeCoords: [number, number][];
  pointCount: number;
  actualPath: ActualPathPoint[];
  markedWaypoints: MarkedWaypoint[];
  observations: PatrolObservation[];
}

export interface CompletedPatrolSummary {
  patrolId: string;
  patrolName: string;
  park: string;
  priority: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  actualPath: ActualPathPoint[];
  markedWaypoints: MarkedWaypoint[];
  observations: PatrolObservation[];
  patrolStatus: 'COMPLETED';
  rangerStatus: 'AVAILABLE';
  completedAt: string;
}


