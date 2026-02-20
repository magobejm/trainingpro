import React, { useMemo, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { createQueryClient } from './src/data/query-client';
import { useMeQuery } from './src/data/hooks/useMeQuery';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RoleSelectScreen } from './src/screens/auth/RoleSelectScreen';
import { CardioSessionScreen } from './src/screens/client/CardioSessionScreen';
import { IncidentCreateScreen } from './src/screens/client/IncidentCreateScreen';
import { ProgressScreen } from './src/screens/client/ProgressScreen';
import { TodaySessionScreen } from './src/screens/client/TodaySessionScreen';
import { WeeklyReportScreen } from './src/screens/client/WeeklyReportScreen';
import { NotificationSettingsScreen } from './src/screens/coach/NotificationSettingsScreen';
import { ChatScreen } from './src/screens/shared/ChatScreen';
import { useAuthStore } from './src/store/auth.store';

type AppRole = 'admin' | 'client' | 'coach';
type RouteId =
  | 'client.cardio'
  | 'client.chat'
  | 'client.incident'
  | 'client.progress'
  | 'client.report'
  | 'client.today'
  | 'coach.chat'
  | 'coach.notifications';

type RouteOption = {
  id: RouteId;
  labelKey: string;
};

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
  const { t } = useTranslation();
  const clearSession = useAuthStore((state) => state.clearSession);
  const routes = useMemo(() => readRoutes(props.role), [props.role]);
  const [route, setRoute] = useState<RouteId>(routes[0]?.id ?? 'client.today');
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('app.title')}</Text>
        <Pressable onPress={clearSession} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>{t('mobile.shell.logout')}</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {routes.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setRoute(item.id)}
            style={[styles.tab, route === item.id ? styles.tabActive : null]}
          >
            <Text style={[styles.tabLabel, route === item.id ? styles.tabLabelActive : null]}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.body}>{renderRoute(route, props.role)}</View>
    </View>
  );
}

function readRoutes(role: AppRole): RouteOption[] {
  if (role === 'coach') {
    return [
      { id: 'coach.notifications', labelKey: 'mobile.tab.notifications' },
      { id: 'coach.chat', labelKey: 'mobile.tab.chat' },
    ];
  }
  return [
    { id: 'client.today', labelKey: 'mobile.tab.today' },
    { id: 'client.cardio', labelKey: 'mobile.tab.cardio' },
    { id: 'client.progress', labelKey: 'mobile.tab.progress' },
    { id: 'client.incident', labelKey: 'mobile.tab.incident' },
    { id: 'client.report', labelKey: 'mobile.tab.report' },
    { id: 'client.chat', labelKey: 'mobile.tab.chat' },
  ];
}

function renderRoute(route: RouteId, role: AppRole): React.JSX.Element {
  if (role === 'admin') {
    return <LoadingBody />;
  }
  if (route === 'client.today') {
    return <TodaySessionScreen />;
  }
  if (route === 'client.cardio') {
    return <CardioSessionScreen />;
  }
  if (route === 'client.progress') {
    return <ProgressScreen />;
  }
  if (route === 'client.incident') {
    return <IncidentCreateScreen />;
  }
  if (route === 'client.report') {
    return <WeeklyReportScreen />;
  }
  if (route === 'coach.notifications') {
    return <NotificationSettingsScreen />;
  }
  return <ChatScreen />;
}

function LoadingBody(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator />
      <Text style={styles.loadingText}>{t('mobile.shell.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  loadingText: {
    color: '#5d6f85',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 9,
    minHeight: 34,
    minWidth: 92,
    paddingHorizontal: 10,
  },
  logoutLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 34,
  },
  page: {
    backgroundColor: '#f1f6fc',
    flex: 1,
  },
  tab: {
    backgroundColor: '#dce6f4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: '#1c74e9',
  },
  tabLabel: {
    color: '#24344b',
    fontSize: 12,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  tabs: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    color: '#10233c',
    fontSize: 18,
    fontWeight: '800',
  },
});
