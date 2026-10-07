export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export type IncidentCategory =
  | 'poaching_activity'
  | 'illegal_logging'
  | 'wildlife_sighting'
  | 'injured_animal'
  | 'snare_detected'
  | 'other';

export type ConflictCategory =
  | 'crop_damage'
  | 'livestock_predation'
  | 'property_damage'
  | 'human_injury'
  | 'animal_intrusion';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  address?: string;
}

export interface IncidentReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterBadgeNumber?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: LocationData;
  photoUris?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConflictReport {
  id: string;
  reporterId: string;
  category: ConflictCategory;
  animalSpecies?: string;
  description: string;
  location: LocationData;
  photoUris?: string[];
  contactNumber: string;
  status: IncidentStatus;
  createdAt: string;
}
