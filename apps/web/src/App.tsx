import React, { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import './i18n';
import { CoachesScreen } from './screens/admin/CoachesScreen';
import { SubscriptionScreen } from './screens/admin/SubscriptionScreen';
import { ClientsScreen } from './screens/coach/ClientsScreen';
import { LibraryCardioMethodsScreen } from './screens/coach/LibraryCardioMethodsScreen';
import { LibraryExercisesScreen } from './screens/coach/LibraryExercisesScreen';
import { LibraryFoodsScreen } from './screens/coach/LibraryFoodsScreen';
import { PlanBuilderCardioScreen } from './screens/coach/PlanBuilderCardioScreen';
import { PlanBuilderDietScreen } from './screens/coach/PlanBuilderDietScreen';
import { PlanBuilderStrengthScreen } from './screens/coach/PlanBuilderStrengthScreen';
import { ProgressScreen } from './screens/coach/ProgressScreen';
import { IncidentsScreen } from './screens/coach/IncidentsScreen';
import { ChatScreen } from './screens/coach/ChatScreen';
import { NotificationSettingsScreen } from './screens/coach/NotificationSettingsScreen';
import { useAuthStore } from './store/auth.store';
import { LoginScreen } from './screens/auth/LoginScreen';
import { RoleSelectScreen } from './screens/auth/RoleSelectScreen';
import { SidebarIdentity, TopBar } from './layout/ShellChrome';
import { UNAUTHORIZED_EVENT } from './data/api-client';
import { useSessionSync } from './data/hooks/useSessionSync';
import { useMeQuery } from './data/hooks/useMeQuery';
import { SidebarUserPanel } from './layout/SidebarUserPanel';
import { logoutSession } from './data/auth-service';
import { styles } from './App.styles';
import { type ShellNavItem, type ShellRoute, usePersistentShellRoute } from './layout/usePersistentShellRoute';

export function App(): React.JSX.Element {
  useSessionSync();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const availableRoles = useAuthStore((state) => state.availableRoles);
  const clearSession = useAuthStore((state) => state.clearSession);
  useEffect(() => {
    const onUnauthorized = () => {
      void clearAuthContext(clearSession, queryClient.clear);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession, queryClient]);
  const hasRole = isSupportedRole(activeRole) && availableRoles.includes(activeRole);
  if (!accessToken) {
    return <LoginScreen />;
  }
  if (!hasRole) {
    return <RoleSelectScreen />;
  }
  return (
    <Shell
      activeRole={activeRole}
      onLogout={() => clearAuthContext(clearSession, queryClient.clear)}
    />
  );
}

function Shell(props: {
  activeRole: 'admin' | 'client' | 'coach';
  onLogout: () => Promise<void>;
}): React.JSX.Element {
  const { t } = useTranslation();
  const meQuery = useMeQuery();
  const navItems = useMemo(() => resolveNavItems(props.activeRole), [props.activeRole]);
  const [route, setRoute] = usePersistentShellRoute(props.activeRole, navItems);
  return (
    <View style={styles.page}>
      <View style={styles.sidebar}>
        <SidebarIdentity roleLabel={t(`auth.role.${props.activeRole}`)} title={t('app.title')} />
        <View style={styles.navList}>{renderNavButtons(navItems, route, setRoute, t)}</View>
        <SidebarUserPanel email={meQuery.data?.email ?? ''} fallbackName={t('app.user.fallbackName')} t={t} />
        <Pressable onPress={() => void props.onLogout()} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>{t('app.nav.logout')}</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <TopBar roleLabel={t(`auth.role.${props.activeRole}`)} title={t('screen.dashboard.title')} />
        <View style={styles.contentBody}>{resolveRouteScreen(route, props.activeRole)}</View>
      </View>
    </View>
  );
}

function renderNavButtons(
  navItems: ShellNavItem[],
  route: ShellRoute,
  onSelect: (route: ShellRoute) => void,
  t: (key: string) => string,
) {
  return navItems.map((item) => (
    <Pressable
      key={item.id}
      onPress={() => onSelect(item.id)}
      style={[styles.navButton, route === item.id ? styles.navButtonActive : null]}
    >
      <View style={styles.navRow}>
        <View style={[styles.navIconBadge, route === item.id ? styles.navIconBadgeActive : null]}>
          <Text style={[styles.navIcon, route === item.id ? styles.navIconActive : null]}>
            {item.icon}
          </Text>
        </View>
        <Text style={[styles.navLabel, route === item.id ? styles.navLabelActive : null]}>
          {t(item.labelKey)}
        </Text>
      </View>
    </Pressable>
  ));
}

function resolveRouteScreen(
  route: ShellRoute,
  role: 'admin' | 'client' | 'coach',
): React.JSX.Element {
  if (role === 'admin') {
    return route === 'admin.subscription' ? <SubscriptionScreen /> : <CoachesScreen />;
  }
  return resolveCoachRouteScreen(route);
}

function resolveCoachRouteScreen(route: ShellRoute): React.JSX.Element {
  const coachScreen =
    resolveCoachLibraryScreen(route) ??
    resolveCoachBuilderScreen(route) ??
    resolveCoachMonitoringScreen(route);
  return coachScreen ?? <ClientsScreen />;
}

function resolveCoachLibraryScreen(route: ShellRoute): null | React.JSX.Element {
  if (route === 'coach.library.exercises') return <LibraryExercisesScreen />;
  if (route === 'coach.library.cardio') return <LibraryCardioMethodsScreen />;
  if (route === 'coach.library.foods') return <LibraryFoodsScreen />;
  return null;
}

function resolveCoachBuilderScreen(route: ShellRoute): null | React.JSX.Element {
  if (route === 'coach.builder.strength') return <PlanBuilderStrengthScreen />;
  if (route === 'coach.builder.cardio') return <PlanBuilderCardioScreen />;
  if (route === 'coach.builder.diet') return <PlanBuilderDietScreen />;
  return null;
}

function resolveCoachMonitoringScreen(route: ShellRoute): null | React.JSX.Element {
  if (route === 'coach.progress') return <ProgressScreen />;
  if (route === 'coach.incidents') return <IncidentsScreen />;
  if (route === 'coach.chat') return <ChatScreen />;
  if (route === 'coach.notifications') return <NotificationSettingsScreen />;
  return null;
}

async function clearAuthContext(
  clearSession: () => void,
  clearQueryCache: () => void,
): Promise<void> {
  try {
    await logoutSession();
  } finally {
    clearQueryCache();
    clearSession();
  }
}

function resolveNavItems(role: 'admin' | 'client' | 'coach'): ShellNavItem[] {
  if (role === 'admin') {
    return [
      { icon: '🧑‍🏫', id: 'admin.coaches', labelKey: 'app.nav.admin.coaches' },
      { icon: '💳', id: 'admin.subscription', labelKey: 'app.nav.admin.subscription' },
    ];
  }
  return [
    { icon: '👥', id: 'coach.clients', labelKey: 'app.nav.coach.clients' },
    { icon: '🏋️', id: 'coach.library.exercises', labelKey: 'app.nav.coach.library.exercises' },
    { icon: '🏃', id: 'coach.library.cardio', labelKey: 'app.nav.coach.library.cardio' },
    { icon: '🥗', id: 'coach.library.foods', labelKey: 'app.nav.coach.library.foods' },
    { icon: '🧩', id: 'coach.builder.strength', labelKey: 'app.nav.coach.builder.strength' },
    { icon: '⏱️', id: 'coach.builder.cardio', labelKey: 'app.nav.coach.builder.cardio' },
    { icon: '🥙', id: 'coach.builder.diet', labelKey: 'app.nav.coach.builder.diet' },
    { icon: '📈', id: 'coach.progress', labelKey: 'app.nav.coach.progress' },
    { icon: '⚠️', id: 'coach.incidents', labelKey: 'app.nav.coach.incidents' },
    { icon: '💬', id: 'coach.chat', labelKey: 'app.nav.coach.chat' },
    { icon: '🔔', id: 'coach.notifications', labelKey: 'app.nav.coach.notifications' },
  ];
}

function isSupportedRole(
  role: 'admin' | 'client' | 'coach' | null,
): role is 'admin' | 'client' | 'coach' {
  return role === 'admin' || role === 'coach' || role === 'client';
}
