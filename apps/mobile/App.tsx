import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { createQueryClient } from './src/data/query-client';
import { useMeQuery } from './src/data/hooks/useMeQuery';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RoleSelectScreen } from './src/screens/auth/RoleSelectScreen';
import { NotificationSettingsScreen } from './src/screens/coach/NotificationSettingsScreen';
import { ChatScreen } from './src/screens/shared/ChatScreen';
import { useAuthStore } from './src/store/auth.store';
import { ClientShell } from './src/shell/client/ClientShell';

type AppRole = 'admin' | 'client' | 'coach';
type CoachRouteId = 'coach.chat' | 'coach.notifications';

const queryClient = createQueryClient();

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileRoot />
    </QueryClientProvider>
  );
}

function MobileRoot(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const roles = useAuthStore((state) => state.availableRoles);
  useMeQuery();
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

function CoachShell(): React.JSX.Element {
  const { t } = useTranslation();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [route, setRoute] = React.useState<CoachRouteId>('coach.notifications');
  return (
    <View style={styles.coachPage}>
      <View style={styles.coachHeader}>
        <Text style={styles.coachTitle}>{t('app.title')}</Text>
        <Pressable onPress={clearSession} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>{t('mobile.shell.logout')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.coachTabs} horizontal showsHorizontalScrollIndicator={false}>
        {buildCoachRoutes(t).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setRoute(item.id)}
            style={[styles.coachTab, route === item.id ? styles.coachTabActive : null]}
          >
            <Text style={[styles.coachTabLabel, route === item.id ? styles.coachTabLabelActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.coachBody}>
        {route === 'coach.notifications' ? <NotificationSettingsScreen /> : <ChatScreen />}
      </View>
    </View>
  );
}

function buildCoachRoutes(t: (key: string) => string): { id: CoachRouteId; label: string }[] {
  return [
    { id: 'coach.notifications', label: t('mobile.tab.notifications') },
    { id: 'coach.chat', label: t('mobile.tab.chat') },
  ];
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
  coachBody: {
    flex: 1,
  },
  coachHeader: {
    alignItems: 'center',
    backgroundColor: '#0f0020',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  coachPage: {
    backgroundColor: '#07000f',
    flex: 1,
  },
  coachTab: {
    backgroundColor: 'rgba(109,40,217,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coachTabActive: {
    backgroundColor: '#ec4899',
  },
  coachTabLabel: {
    color: 'rgba(196,181,253,0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
  coachTabLabelActive: {
    color: '#ffffff',
  },
  coachTabs: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coachTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
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
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(236,72,153,0.2)',
    borderColor: 'rgba(236,72,153,0.4)',
    borderRadius: 9,
    borderWidth: 1,
    minHeight: 34,
    minWidth: 92,
    paddingHorizontal: 10,
  },
  logoutLabel: {
    color: '#ec4899',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 34,
  },
});
