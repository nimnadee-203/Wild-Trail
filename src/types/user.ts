export type UserRole = 'ranger' | 'community' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string; // For Rangers
  villageName?: string; // For Community Reporters
  phoneNumber?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
