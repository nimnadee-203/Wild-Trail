import { LocationData } from './incident';

export type AlertLevel = 'info' | 'warning' | 'danger';

export interface WildlifeAlert {
  id: string;
  title: string;
  message: string;
  level: AlertLevel;
  affectedZone: string;
  location?: LocationData;
  radiusKm?: number;
  timestamp: string;
  active: boolean;
}
