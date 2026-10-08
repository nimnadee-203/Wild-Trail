export const STORAGE_KEYS = {
  AUTH_TOKEN: '@wildlife_auth_token',
  USER_PROFILE: '@wildlife_user_profile',
  PENDING_INCIDENTS: '@wildlife_pending_incidents',
  PENDING_CONFLICTS: '@wildlife_pending_conflicts',
  ACTIVE_PATROL: '@wildlife_active_patrol',
  RANGER_STATUS: '@wildlife_ranger_status',
  COMPLETED_PATROLS: '@wildlife_completed_patrols',
  OFFLINE_CACHE: '@wildlife_offline_cache',
  OFFLINE_QUEUE: '@wildlife_offline_queue',
  NETWORK_STATUS: '@wildlife_network_status',
  STAFF_USERS: '@wildlife_staff_users',
  MOCK_RANGERS: '@wildlife_mock_rangers',
  RANGER_AVATAR: '@wildlife_ranger_avatar',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
