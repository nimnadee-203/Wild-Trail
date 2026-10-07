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

export interface ScheduledPatrol {
  id: string;
  teamName: string;
  rangerName: string;
  zone: string;
  date: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  status: ScheduledPatrolStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduledPatrolInput = Omit<ScheduledPatrol, 'id' | 'createdAt' | 'updatedAt'>;

export type RangerStatus = 'AVAILABLE' | 'ON_PATROL' | 'OFF_DUTY';

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
}


