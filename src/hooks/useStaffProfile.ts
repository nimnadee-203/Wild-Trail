import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { storageService } from '../storage/asyncStorage';
import { STORAGE_KEYS } from '../storage/keys';
import { StaffUser } from '../types/user';

export function useStaffProfile() {
  const [profile, setProfile] = useState<StaffUser | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE)
      .then(value => { if (active) setProfile(value); })
      .catch(() => { if (active) setProfile(null); });
    return () => { active = false; };
  }, []));
  return profile;
}
