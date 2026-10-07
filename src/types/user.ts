export type UserRole = 'ranger' | 'manager' | 'liaison' | 'admin' | 'community';

export type AccountStatus = 'ACTIVE' | 'DISABLED';

export interface StaffUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  staffId?: string;
  badge?: string;
  profileId: string;
  accountStatus: AccountStatus;
  parkId: string;
  zoneId: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RangerProfileDoc {
  id: string; // e.g. "ranger-204"
  userId: string; // firebaseUid
  name: string;
  badge: string;
  parkId: string;
  zoneId: string;
  status: 'AVAILABLE' | 'ON_PATROL' | 'RESPONDING_TO_ALERT' | 'OFF_DUTY' | 'ON_LEAVE' | 'UNAVAILABLE';
  currentPatrolId: string | null;
  currentAlertId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  villageName?: string;
  phoneNumber?: string;
  accountStatus?: AccountStatus;
  parkId?: string;
  zoneId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
