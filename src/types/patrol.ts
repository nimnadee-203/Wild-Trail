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

