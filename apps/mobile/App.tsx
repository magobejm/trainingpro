import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { useMeQuery } from './src/data/hooks/useMeQuery';
import { createQueryClient } from './src/data/query-client';
import { useNotificationNavigation } from './src/data/use-notification-navigation';
import { usePushRegistration } from './src/data/use-push-registration';
import { startSessionSync } from './src/data/session-sync';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RoleSelectScreen } from './src/screens/auth/RoleSelectScreen';
import { useAuthStore } from './src/store/auth.store';
import { ClientShell } from './src/shell/client/ClientShell';
import { CoachShell } from './src/shell/coach/CoachShell';

type AppRole = 'admin' | 'client' | 'coach';

const queryClient = createQueryClient();

export default function App(): React.JSX.Element {
  useSessionSync();
  return (
    <QueryClientProvider client={queryClient}>
      <MobileRoot />
    </QueryClientProvider>
  );
}

function useSessionSync(): void {
  React.useEffect(() => {
    let stopSync = (): void => undefined;
    let started = false;
    const start = (): void => {
      if (started) {
        return;
      }
      started = true;
      stopSync = startSessionSync(queryClient);
    };
    const unsubscribe = useAuthStore.persist.onFinishHydration(start);
    if (useAuthStore.persist.hasHydrated()) {
      start();
    }
    return () => {
      unsubscribe();
      stopSync();
    };
  }, []);
}

function MobileRoot(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const roles = useAuthStore((state) => state.availableRoles);
  const status = useAuthStore((state) => state.status);
  useMeQuery();
  usePushRegistration();
  useNotificationNavigation();
  if (status === 'restoring') {
    return <LoadingBody />;
  }
  if (!accessToken) {
    return <LoginScreen />;
  }
  if (!hasResolvedRole(activeRole, roles)) {
    return <RoleSelectScreen />;
  }
  return <RoleShell role={activeRole} />;
}

function hasResolvedRole(activeRole: AppRole | null, roles: AppRole[]): activeRole is AppRole {
  if (!activeRole) {
    return false;
  }
  return roles.includes(activeRole);
}

function RoleShell(props: { role: AppRole }): React.JSX.Element {
  if (props.role === 'client') {
    return <ClientShell />;
  }
  if (props.role === 'coach') {
    return <CoachShell />;
  }
  return <LoadingBody />;
}

function LoadingBody(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={'#ec4899'} />
      <Text style={styles.loadingText}>{t('mobile.shell.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    color: 'rgba(196,181,253,0.7)',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    backgroundColor: '#07000f',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
});
