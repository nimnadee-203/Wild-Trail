import { UserRole } from '../types/user';

export const USER_ROLES: Record<UserRole, { key: UserRole; title: string; description: string }> = {
  ranger: {
    key: 'ranger',
    title: 'Wildlife Ranger',
    description: 'Patrol tracking, poaching alerts, and incident response.',
  },
  manager: {
    key: 'manager',
    title: 'Park Manager',
    description: 'Patrol scheduling, team assignments, and sector management.',
  },
  liaison: {
    key: 'liaison',
    title: 'Community Liaison',
    description: 'Human-wildlife conflict mitigation and community safety alerts.',
  },
  admin: {
    key: 'admin',
    title: 'System Administrator',
    description: 'Staff account management, access control, and user provisioning.',
  },
  community: {
    key: 'community',
    title: 'Community Resident',
    description: 'Conflict reporting and local safety warnings.',
  },
};
