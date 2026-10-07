import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { storageService } from '../storage/asyncStorage';
import { STORAGE_KEYS } from '../storage/keys';
import { StaffUser, UserRole } from '../types/user';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkUserRole() {
      setIsChecking(true);
      const userProfile = await storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE);

      if (!isMounted) return;

      if (!userProfile) {
        setIsAuthorized(false);
        setIsChecking(false);
        router.replace('/(auth)/login');
        return;
      }

      if (userProfile.accountStatus === 'DISABLED') {
        await storageService.removeItem(STORAGE_KEYS.USER_PROFILE);
        setIsAuthorized(false);
        setIsChecking(false);
        router.replace('/(auth)/login');
        return;
      }

      if (!allowedRoles.includes(userProfile.role)) {
        setIsAuthorized(false);
        setIsChecking(false);

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
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    }

    checkUserRole();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, router, segments]);

  return { isChecking, isAuthorized };
}
