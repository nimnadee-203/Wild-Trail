import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { storageService } from '../storage/asyncStorage';
import { STORAGE_KEYS } from '../storage/keys';
import { StaffUser, UserRole } from '../types/user';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function checkUserRole() {
      const userProfile = await storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE);

      if (!userProfile) {
        router.replace('/(auth)/login');
        return;
      }

      if (userProfile.accountStatus === 'DISABLED') {
        await storageService.removeItem(STORAGE_KEYS.USER_PROFILE);
        router.replace('/(auth)/login');
        return;
      }

      if (!allowedRoles.includes(userProfile.role)) {
        // Redirect user back to their allowed role home route
        switch (userProfile.role) {
          case 'admin':
            router.replace('/(admin)/users' as any);
            break;
          case 'manager':
            router.replace('/(manager)/overview' as any);
            break;
          case 'liaison':
            router.replace('/(liaison)/dashboard' as any);
            break;
          case 'ranger':
          default:
            router.replace('/(ranger)/dashboard' as any);
            break;
        }
      }
    }

    checkUserRole();
  }, [segments, allowedRoles, router]);
}
