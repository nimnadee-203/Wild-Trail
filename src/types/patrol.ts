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
