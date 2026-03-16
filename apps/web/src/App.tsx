import React, { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dumbbell,
  Apple,
  LineChart,
  AlertCircle,
  MessageSquare,
  GraduationCap,
  CreditCard,
  BarChart2,
  User,
  CalendarDays,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import './i18n';
import { CoachesScreen } from './screens/admin/CoachesScreen';
import { SubscriptionScreen } from './screens/admin/SubscriptionScreen';
import { ClientsScreen } from './screens/coach/ClientsScreen';
import { LibraryCardioMethodsScreen } from './screens/coach/LibraryCardioMethodsScreen';
import { LibraryExercisesScreen } from './screens/coach/LibraryExercisesScreen';
import { LibraryFoodsScreen } from './screens/coach/LibraryFoodsScreen';
import { LibraryIsometricScreen } from './screens/coach/LibraryIsometricScreen';
import { LibraryPlioScreen } from './screens/coach/LibraryPlioScreen';
import { LibraryMobilityScreen } from './screens/coach/LibraryMobilityScreen';
import { LibrarySportsScreen } from './screens/coach/LibrarySportsScreen';
import { UnifiedExerciseLibraryScreen } from './screens/coach/UnifiedExerciseLibraryScreen';
import { PlanBuilderCardioScreen } from './screens/coach/PlanBuilderCardioScreen';
import { PlanBuilderDietScreen } from './screens/coach/PlanBuilderDietScreen';
import { PlanBuilderStrengthScreen } from './screens/coach/PlanBuilderStrengthScreen';
import { ProgressScreen } from './screens/coach/ProgressScreen';
import { TechniqueEvaluatorScreen } from './screens/coach/TechniqueEvaluatorScreen';
import { IncidentsScreen } from './screens/coach/IncidentsScreen';
import { ChatScreen } from './screens/coach/ChatScreen';
import { NotificationSettingsScreen } from './screens/coach/NotificationSettingsScreen';
import { RoutinePlannerScreen } from './screens/coach/RoutinePlannerScreen';
import { WarmupPlannerScreen } from './screens/coach/WarmupPlannerScreen';
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
import { useRoutinePlannerContextStore } from './store/routinePlannerContext.store';

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
  return <Shell activeRole={activeRole} onLogout={() => clearAuthContext(clearSession, queryClient.clear)} />;
}

function ShellSidebar(props: {
  activeRole: 'admin' | 'client' | 'coach';
  navItems: ShellNavItem[];
  route: ShellRoute;
  setRoute: (r: ShellRoute) => void;
  onLogout: () => void;
  email: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.sidebar}>
      <SidebarIdentity roleLabel={t('app.brand.subtitle')} title={t('app.title')} />
      <View style={styles.navList}>{renderNavButtons(props.navItems, props.route, props.setRoute, t)}</View>
      <SidebarUserPanel email={props.email} fallbackName={t('app.user.fallbackName')} t={t} />
      <Pressable onPress={props.onLogout} style={styles.logoutButton}>
        <Text style={styles.logoutLabel}>{t('app.nav.logout')}</Text>
      </Pressable>
    </View>
  );
}

function Shell(props: { activeRole: 'admin' | 'client' | 'coach'; onLogout: () => Promise<void> }): React.JSX.Element {
  const vm = useShellViewModel(props.activeRole);
  return <ShellView {...vm} onLogout={props.onLogout} />;
}

function useShellViewModel(activeRole: 'admin' | 'client' | 'coach') {
  const { t } = useTranslation();
  const meQuery = useMeQuery();
  const clearRoutinePlannerContext = useRoutinePlannerContextStore((state) => state.clear);
  const navItems = useMemo(() => resolveNavItems(activeRole), [activeRole]);
  const [route, setRoute] = usePersistentShellRoute(activeRole, navItems);
  const onSetRoute = (nextRoute: ShellRoute) => {
    if (nextRoute === 'coach.routine.planner') {
      clearRoutinePlannerContext();
    }
    setRoute(nextRoute);
  };
  return { activeRole, email: meQuery.data?.email ?? '', navItems, onSetRoute, route, setRoute, t };
}

function ShellView(props: {
  activeRole: 'admin' | 'client' | 'coach';
  email: string;
  navItems: ShellNavItem[];
  onLogout: () => Promise<void>;
  onSetRoute: (nextRoute: ShellRoute) => void;
  route: ShellRoute;
  setRoute: (route: ShellRoute) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.page}>
      <ShellSidebar
        activeRole={props.activeRole}
        email={props.email}
        navItems={props.navItems}
        onLogout={() => void props.onLogout()}
        route={props.route}
        setRoute={props.onSetRoute}
      />
      <ShellContentArea {...props} />
    </View>
  );
}

function ShellContentArea(props: {
  activeRole: 'admin' | 'client' | 'coach';
  route: ShellRoute;
  setRoute: (route: ShellRoute) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.content}>
      <TopBar roleLabel={props.t(`auth.role.${props.activeRole}`)} title={props.t('screen.dashboard.title')} />
      <View style={styles.contentBody}>{resolveRouteScreen(props.route, props.activeRole, props.setRoute)}</View>
    </View>
  );
}

function NavButtonContent({
  item,
  isActive,
  hovered,
  t,
}: {
  item: ShellNavItem;
  isActive: boolean;
  hovered: boolean;
  t: (k: string) => string;
}) {
  const iconColor = isActive || hovered ? '#ffffff' : '#94a3b8';
  const gradientSize = isActive || hovered ? '100% 100%' : '0% 100%';
  const customBadgeStyle = item.badgeColor && !isActive && !hovered ? { backgroundColor: item.badgeColor } : {};
  return (
    <>
      <View style={[styles.navButtonGradient, { backgroundSize: gradientSize } as ViewStyle]} />
      {isActive && <View style={styles.activeIndicator} />}
      <View style={styles.navRow}>
        <View style={[styles.navIconBadge, (isActive || hovered) && styles.navIconBadgeActive, customBadgeStyle]}>
          {item.icon({ color: iconColor, size: 20 })}
        </View>
        <Text style={[styles.navLabel, isActive && styles.navLabelActive, hovered && !isActive && styles.navLabelHovered]}>
          {t(item.labelKey)}
        </Text>
      </View>
    </>
  );
}

function renderNavButtons(
  navItems: ShellNavItem[],
  route: ShellRoute,
  onSelect: (route: ShellRoute) => void,
  t: (key: string) => string,
) {
  return navItems.map((item) => {
    const isActive = route === item.id;
    return (
      <Pressable
        key={item.id}
        onPress={() => onSelect(item.id)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={() => [styles.navButton, isActive && styles.navButtonActive] as any}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {({ hovered }: any) => <NavButtonContent item={item} isActive={isActive} hovered={hovered} t={t} />}
      </Pressable>
    );
  });
}

function resolveRouteScreen(
  route: ShellRoute,
  role: 'admin' | 'client' | 'coach',
  setRoute: (route: ShellRoute) => void,
): React.JSX.Element {
  if (role === 'admin') {
    return route === 'admin.subscription' ? <SubscriptionScreen /> : <CoachesScreen />;
  }
  return resolveCoachRouteScreen(route, setRoute);
}

function resolveCoachRouteScreen(route: ShellRoute, setRoute: (route: ShellRoute) => void): React.JSX.Element {
  const coachScreen =
    resolveCoachLibraryScreen(route, setRoute) ?? resolveCoachBuilderScreen(route) ?? resolveCoachMonitoringScreen(route);
  return coachScreen ?? <ClientsScreen onRouteChange={setRoute} />;
}

function resolveCoachLibraryScreen(route: ShellRoute, setRoute: (route: ShellRoute) => void): null | React.JSX.Element {
  if (route === 'coach.library.unified') return <UnifiedExerciseLibraryScreen />;
  if (route === 'coach.library.exercises') return <LibraryExercisesScreen />;
  if (route === 'coach.library.cardio') return <LibraryCardioMethodsScreen />;
  if (route === 'coach.library.foods') return <LibraryFoodsScreen />;
  if (route === 'coach.library.isometrics') return <LibraryIsometricScreen />;
  if (route === 'coach.library.plyometrics') return <LibraryPlioScreen />;
  if (route === 'coach.library.mobility') return <LibraryMobilityScreen />;
  if (route === 'coach.library.sports') return <LibrarySportsScreen />;
  if (route === 'coach.routine.planner') return <RoutinePlannerScreen onRouteChange={setRoute} />;
  if (route === 'coach.warmup.planner') return <WarmupPlannerScreen />;
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
  if (route === 'coach.evaluator') return <TechniqueEvaluatorScreen />;
  if (route === 'coach.incidents') return <IncidentsScreen />;
  if (route === 'coach.chat') return <ChatScreen />;
  if (route === 'coach.notifications') return <NotificationSettingsScreen />;
  return null;
}

async function clearAuthContext(clearSession: () => void, clearQueryCache: () => void): Promise<void> {
  try {
    await logoutSession();
  } finally {
    clearQueryCache();
    clearSession();
  }
}

function resolveNavItems(role: 'admin' | 'client' | 'coach'): ShellNavItem[] {
  if (role === 'admin') return resolveAdminNavItems();
  return resolveCoachNavItems();
}

function resolveAdminNavItems(): ShellNavItem[] {
  return [
    { icon: (p) => <GraduationCap {...p} />, id: 'admin.coaches', labelKey: 'app.nav.admin.coaches' },
    { icon: (p) => <CreditCard {...p} />, id: 'admin.subscription', labelKey: 'app.nav.admin.subscription' },
  ];
}

function resolveCoachNavItems(): ShellNavItem[] {
  return [
    {
      icon: (p) => <User {...p} />,
      id: 'coach.clients',
      labelKey: 'app.nav.coach.clients',
      badgeColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      icon: (p) => <Dumbbell {...p} />,
      id: 'coach.library.unified',
      labelKey: 'app.nav.coach.library.unified',
      badgeColor: 'rgba(37, 99, 235, 0.1)',
    },
    {
      icon: (p) => <Apple {...p} />,
      id: 'coach.library.foods',
      labelKey: 'app.nav.coach.library.foods',
      badgeColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: (p) => <CalendarDays {...p} />,
      id: 'coach.routine.planner',
      labelKey: 'app.nav.coach.routine.planner',
      badgeColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      icon: (p) => <CalendarDays {...p} />,
      id: 'coach.warmup.planner',
      labelKey: 'app.nav.coach.warmup.planner',
      badgeColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      icon: (p) => <LineChart {...p} />,
      id: 'coach.progress',
      labelKey: 'app.nav.coach.progress',
      badgeColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: (p) => <BarChart2 {...p} />,
      id: 'coach.evaluator',
      labelKey: 'app.nav.coach.evaluator',
      badgeColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: (p) => <AlertCircle {...p} />,
      id: 'coach.incidents',
      labelKey: 'app.nav.coach.incidents',
      badgeColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      icon: (p) => <MessageSquare {...p} />,
      id: 'coach.chat',
      labelKey: 'app.nav.coach.chat',
      badgeColor: 'rgba(248, 250, 252, 0.1)',
    },
    {
      icon: (p) => <AlertCircle {...p} />,
      id: 'coach.notifications',
      labelKey: 'app.nav.coach.notifications',
      badgeColor: 'rgba(239, 68, 68, 0.1)',
    },
  ];
}

function isSupportedRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  role: 'admin' | 'client' | 'coach' | null | any,
): role is 'admin' | 'client' | 'coach' {
  return role === 'admin' || role === 'coach' || role === 'client';
}
