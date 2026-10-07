import { LocationData } from './incident';

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
