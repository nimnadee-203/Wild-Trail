/**
 * Wildlife Risk Alert & GPS Collar Monitoring Type Definitions
 * Feature: Monitor Tracked Wildlife and Respond to Risk Alerts (UC3)
 */

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskZoneType =
  | 'Farmland'
  | 'Road'
  | 'Village'
  | 'Forest Boundary'
  | 'Waterhole'
  | 'Buffer Zone'
  | 'Sanctuary Border'
  | 'Settlement Perimeter';

export interface RiskZoneBoundary {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  polygon?: [number, number][]; // Optional polygon coordinates [lat, lng]
}

export interface LocationReading {
  readingId: string;
  animalId: string;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO 8601 string
  speed?: number;
  heading?: string;
  batteryLevel?: number;
}

export interface TrackedAnimal {
  animalId: string;
  species: string;
  name: string;
  collarId: string;
  age?: number;
  sex?: 'Male' | 'Female' | 'Unknown';
  notes?: string;
  imageUrl?: string;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export type ResponderRole = 'ranger' | 'liaison';

export interface EligibleResponder {
  id: string;
  userId?: string;
  name: string;
  role: ResponderRole;
  badge?: string;
  phone?: string;
  parkId?: string;
  zoneId?: string;
  status: 'AVAILABLE' | 'ON_PATROL' | 'RESPONDING_TO_ALERT' | 'UNAVAILABLE';
}

export type AlertLifecycleStatus =
  | 'NEW'
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESPONDED'
  | 'ESCALATED'
  | 'RESOLVED';

export type StandardCannotRespondReason =
  | 'Currently handling another incident'
  | 'Too far from the location'
  | 'Unavailable'
  | 'Other reason';

export interface DeclineRecord {
  responderId: string;
  responderName: string;
  responderRole: ResponderRole;
  reason: string;
  timestamp: string;
}

export interface AssignedResponderInfo {
  responderId: string;
  responderName: string;
  responderRole: ResponderRole;
  assignedAt: string;
}

export interface WildlifeRiskAlert {
  id: string;
  alertId: string;
  animalId: string;
  species: string;
  riskZoneId: string;
  riskZoneName: string;
  riskZoneType: RiskZoneType;
  riskLevel: RiskLevel;
  location: string;
  latitude: number;
  longitude: number;
  status: AlertLifecycleStatus;
  createdAt: string;
  assignedResponder?: AssignedResponderInfo | null;
  acknowledgedAt?: string;
  respondedAt?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  escalationReason?: string;
  escalationCount?: number;
  declinedResponders?: DeclineRecord[];
  declineReason?: string;
  image?: string;
  description?: string;
  distance?: string;
}
