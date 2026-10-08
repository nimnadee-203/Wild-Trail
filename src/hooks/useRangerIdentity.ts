import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { storageService } from '../storage/asyncStorage';
import { STORAGE_KEYS } from '../storage/keys';
import { StaffUser } from '../types/user';
import { DEFAULT_INCIDENT_RANGER } from '../services/incidentReporter';

const DEMO_PHOTO = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80';

export function useRangerIdentity() {
  const [user, setUser] = useState<StaffUser | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE)
      .then(profile => { if (active) setUser(profile); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []));
  return {
    name: user?.name || DEFAULT_INCIDENT_RANGER.name,
    badge: user?.badge || user?.staffId || DEFAULT_INCIDENT_RANGER.badgeNumber,
    photo: user?.photoURL || (!user || user.uid.startsWith('usr-') ? DEMO_PHOTO : undefined),
    station: [user?.parkId, user?.zoneId].filter(Boolean).join(' ? ') || 'Wildlife Conservation Department',
  };
}
