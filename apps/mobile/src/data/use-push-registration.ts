import React from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth.store';

export function usePushRegistration(): void {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const roles = useAuthStore((state) => state.availableRoles);
  const roleKey = roles.join(',');
  React.useEffect(() => {
    if (Platform.OS === 'web' || !accessToken) {
      return undefined;
    }
    if (activeRole !== 'coach' && activeRole !== 'client') {
      return undefined;
    }
    if (!roleKey.split(',').includes(activeRole)) {
      return undefined;
    }
    let cancelled = false;
    void import('./push-registration')
      .then((mod) => {
        if (cancelled) {
          return undefined;
        }
        return mod.registerPushToken({ accessToken, activeRole });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [accessToken, activeRole, roleKey]);
}
