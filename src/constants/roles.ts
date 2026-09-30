import { UserRole } from '../types/user';

export const USER_ROLES: Record<UserRole, { key: UserRole; title: string; description: string }> = {
  ranger: {
    key: 'ranger',
    title: 'Wildlife Ranger',
    description: 'Patrol tracking, poaching alerts, and incident response.',
  },
  community: {
    key: 'community',
    title: 'Community Reporter',
    description: 'Human-wildlife conflict reporting and local safety updates.',
  },
  admin: {
    key: 'admin',
    title: 'System Administrator',
    description: 'System management and analytics overview.',
  },
};
