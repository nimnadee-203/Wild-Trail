import { IncidentStatus } from './incident';

export const COMMUNITY_REPORT_TYPES = {
  elephant_sighting: { label: 'Elephant Sighting', keyword: 'ELEPHANT', category: 'wildlife_sighting' },
  crop_raiding: { label: 'Crop Raiding', keyword: 'CROP', category: 'crop_damage' },
  livestock_attack: { label: 'Livestock Attack', keyword: 'LIVESTOCK', category: 'livestock_predation' },
  property_damage: { label: 'Property Damage', keyword: 'PROPERTY', category: 'property_damage' },
  human_injury: { label: 'Human Injury', keyword: 'INJURY', category: 'human_injury' },
  other_wildlife_conflict: { label: 'Other Wildlife Conflict', keyword: 'OTHER', category: 'other' },
} as const;

export type CommunityReportKind = keyof typeof COMMUNITY_REPORT_TYPES;
export const COMMUNITY_REPORT_KINDS = Object.keys(COMMUNITY_REPORT_TYPES) as CommunityReportKind[];
export const COMMUNITY_SMS_KEYWORDS = COMMUNITY_REPORT_KINDS.map((kind) => COMMUNITY_REPORT_TYPES[kind].keyword).join(', ');

export interface CommunityInput {
  kind: CommunityReportKind;
  village: string;
  boundarySection: string;
  landmark: string;
  description: string;
  contactPhone: string;
  occurredAt: string;
  source: 'community_app' | 'sms_simulated';
}

export interface QueuedCommunityReport {
  id: string;
  collection?: 'communityReports' | 'incidents';
  input: CommunityInput;
  localPhotos: string[];
  uploadedPhotos: string[];
  ownerUid?: string;
  received: boolean;
  complete: boolean;
  error?: string;
}

export interface CommunityReport extends CommunityInput {
  id: string;
  reporterId: string;
  status: IncidentStatus;
  assignedTo: string;
  assignedName?: string;
  demoAcceptance?: boolean;
  responseNotes: string;
  photoUris: string[];
  createdAt: string;
  receivedAt: string;
}
