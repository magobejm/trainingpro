import React, { useEffect, useMemo, useState } from 'react';
import { LoadingState } from './components/AsyncStatus';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Navigate } from 'react-router';
import { useBreakpoint } from '@trainerpro/ui';
import './i18n';
import { LoginScreen } from './screens/auth/LoginScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { RoleSelectScreen } from './screens/auth/RoleSelectScreen';
import { TopBar } from './layout/ShellChrome';
import { UNAUTHORIZED_EVENT } from './data/api-client';
import { markSessionExpired } from './data/session-end';
import { useSessionSync } from './data/hooks/useSessionSync';
import { useMeQuery } from './data/hooks/useMeQuery';
import { logoutSession } from './data/auth-service';
import { styles } from './App.styles';
import { Drawer } from './layout/Drawer';
import { QuickCreateButton } from './layout/QuickCreateButton';
import { applyMenuClientReset } from './layout/menu-client-context';
import { resolveActiveNavRoute } from './layout/nav-groups';
import { resolveNavItems } from './layout/nav-items';
import { resolveRouteTitleKey } from './layout/route-title';
import { ShellSidebar, type ShellSidebarProps } from './layout/ShellSidebar';
import { approveNextLeave, isUnsavedDirty, requestUnsavedLeave } from './layout/unsaved-leave';
import type { ShellRoute } from './layout/usePersistentShellRoute';
import { useCoachMenuBadges } from './layout/useMenuBadges';
import { useShellRouter } from './layout/useShellRouter';
import { useUnsavedLeaveBlocker } from './layout/useUnsavedLeaveBlocker';
import { useAuthStore } from './store/auth.store';
import { usePasswordRecoveryStore } from './store/password-recovery.store';

const CoachesScreen = React.lazy(() =>
  import('./screens/admin/CoachesScreen').then((mod) => ({ default: mod.CoachesScreen })),
);
const SubscriptionScreen = React.lazy(() =>
  import('./screens/admin/SubscriptionScreen').then((mod) => ({ default: mod.SubscriptionScreen })),
);
const LibraryFoodsScreen = React.lazy(() =>
  import('./screens/coach/LibraryFoodsScreen').then((mod) => ({ default: mod.LibraryFoodsScreen })),
);
const LibraryRoutinesScreen = React.lazy(() =>
  import('./screens/coach/LibraryRoutinesScreen').then((mod) => ({ default: mod.LibraryRoutinesScreen })),
);
const UnifiedExerciseLibraryScreen = React.lazy(() =>
  import('./screens/coach/UnifiedExerciseLibraryScreen').then((mod) => ({ default: mod.UnifiedExerciseLibraryScreen })),
);
const ProgressScreen = React.lazy(() =>
  import('./screens/coach/ProgressScreen').then((mod) => ({ default: mod.ProgressScreen })),
);
const CoachTriageScreen = React.lazy(() =>
  import('./screens/coach/CoachTriageScreen').then((mod) => ({ default: mod.CoachTriageScreen })),
);
const TechniqueEvaluatorScreen = React.lazy(() =>
  import('./screens/coach/TechniqueEvaluatorScreen').then((mod) => ({ default: mod.TechniqueEvaluatorScreen })),
);
const IncidentsScreen = React.lazy(() =>
  import('./screens/coach/IncidentsScreen').then((mod) => ({ default: mod.IncidentsScreen })),
);
const ChatScreen = React.lazy(() => import('./screens/coach/ChatScreen').then((mod) => ({ default: mod.ChatScreen })));
const NotificationSettingsScreen = React.lazy(() =>
  import('./screens/coach/NotificationSettingsScreen').then((mod) => ({ default: mod.NotificationSettingsScreen })),
);
const RoutinePlannerScreen = React.lazy(() =>
  import('./screens/coach/RoutinePlannerScreen').then((mod) => ({ default: mod.RoutinePlannerScreen })),
);
const WarmupPlannerScreen = React.lazy(() =>
  import('./screens/coach/WarmupPlannerScreen').then((mod) => ({ default: mod.WarmupPlannerScreen })),
);
const CalendarScreen = React.lazy(() =>
  import('./screens/coach/CalendarScreen').then((mod) => ({ default: mod.CalendarScreen })),
);
const NotesScreen = React.lazy(() => import('./screens/coach/NotesScreen').then((mod) => ({ default: mod.NotesScreen })));
const NutritionScreen = React.lazy(() =>
  import('./screens/coach/nutrition/NutritionScreen').then((mod) => ({ default: mod.NutritionScreen })),
);
const ClientsScreen = React.lazy(() =>
  import('./screens/coach/ClientsScreen').then((mod) => ({ default: mod.ClientsScreen })),
);

export function App(): React.JSX.Element {
  useSessionSync();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const availableRoles = useAuthStore((state) => state.availableRoles);
  const clearSession = useAuthStore((state) => state.clearSession);
  useEffect(() => {
    const onUnauthorized = () => {
      markSessionExpired();
      void clearAuthContext(clearSession, queryClient.clear);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession, queryClient]);
  const recoveryPhase = usePasswordRecoveryStore((state) => state.phase);
  const hasRole = isSupportedRole(activeRole) && availableRoles.includes(activeRole);
  if (recoveryPhase !== 'none') {
    return <ResetPasswordScreen />;
  }
  if (!accessToken) {
    return <LoginScreen />;
  }
  if (!hasRole) {
    return <RoleSelectScreen />;
  }
  return <Shell activeRole={activeRole} onLogout={() => clearAuthContext(clearSession, queryClient.clear)} />;
}

function Shell(props: { activeRole: 'admin' | 'coach'; onLogout: () => Promise<void> }): React.JSX.Element {
  const vm = useShellViewModel(props.activeRole);
  if (vm.redirectTo) {
    return <Navigate replace to={vm.redirectTo} />;
  }
  return <ShellView {...vm} onLogout={props.onLogout} />;
}

function useShellViewModel(activeRole: 'admin' | 'coach') {
  const { t } = useTranslation();
  const meQuery = useMeQuery();
  const navItems = useMemo(() => resolveNavItems(activeRole), [activeRole]);
  const { goTo, parsed, redirectTo } = useShellRouter(activeRole);
  useUnsavedLeaveBlocker();
  const breakpoint = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (breakpoint !== 'sm') setDrawerOpen(false);
  }, [breakpoint]);
  const onMenuRoute = (nextRoute: ShellRoute) => {
    requestUnsavedLeave(() => {
      if (isUnsavedDirty()) approveNextLeave();
      setDrawerOpen(false);
      applyMenuClientReset(nextRoute);
      goTo(nextRoute, { withClient: false });
    });
  };
  return {
    activeRole,
    breakpoint,
    drawerOpen,
    email: meQuery.data?.email ?? '',
    goTo,
    navItems,
    onMenuRoute,
    redirectTo,
    route: parsed?.route ?? (activeRole === 'admin' ? 'admin.coaches' : 'coach.clients'),
    setDrawerOpen,
    t,
  };
}

type ShellViewProps = ReturnType<typeof useShellViewModel> & { onLogout: () => Promise<void> };

function ShellView(props: ShellViewProps): React.JSX.Element {
  const pane = (variant: ShellSidebarProps['variant']) => (
    <NavigationPane
      items={props.navItems}
      onLogout={() => void props.onLogout()}
      onSelect={props.onMenuRoute}
      role={props.activeRole}
      route={resolveActiveNavRoute(props.route)}
      t={props.t}
      email={props.email}
      variant={variant}
    />
  );
  return (
    <View style={styles.page}>
      {props.breakpoint === 'sm' ? null : pane(props.breakpoint === 'md' ? 'compact' : 'full')}
      <ShellContentArea {...props} />
      {props.breakpoint === 'sm' ? (
        <Drawer
          closeLabel={props.t('app.nav.menu.close')}
          onClose={() => props.setDrawerOpen(false)}
          visible={props.drawerOpen}
        >
          {pane('full')}
        </Drawer>
      ) : null}
    </View>
  );
}

type NavigationPaneProps = Omit<ShellSidebarProps, 'badges'> & { role: 'admin' | 'coach' };

function NavigationPane({ role, ...props }: NavigationPaneProps): React.JSX.Element {
  return role === 'coach' ? <CoachNavigation {...props} /> : <ShellSidebar {...props} badges={NO_BADGES} />;
}

function CoachNavigation(props: Omit<ShellSidebarProps, 'badges'>): React.JSX.Element {
  const badges = useCoachMenuBadges();
  return <ShellSidebar {...props} badges={badges} />;
}

const NO_BADGES = {};

function ShellContentArea(props: ShellViewProps): React.JSX.Element {
  const compact = props.breakpoint === 'sm';
  return (
    <View style={styles.content}>
      <TopBar
        compact={compact}
        menuLabel={props.t('app.nav.menu')}
        onMenuPress={compact ? () => props.setDrawerOpen(true) : undefined}
        roleLabel={props.t(`auth.role.${props.activeRole}`)}
        title={props.t(resolveRouteTitleKey(props.route))}
      />
      <View style={styles.contentBody}>
        <React.Suspense fallback={<LoadingState label={props.t('common.loading')} />}>
          {resolveRouteScreen(props.route, props.activeRole, props.goTo)}
        </React.Suspense>
      </View>
      <QuickCreateButton
        compact={compact}
        onMenuRoute={props.onMenuRoute}
        role={props.activeRole}
        route={props.route}
        t={props.t}
      />
    </View>
  );
}

function resolveRouteScreen(
  route: ShellRoute,
  role: 'admin' | 'coach',
  setRoute: (route: ShellRoute) => void,
): React.JSX.Element {
  if (role === 'admin') {
    return route === 'admin.subscription' ? <SubscriptionScreen /> : <CoachesScreen />;
  }
  return resolveCoachRouteScreen(route, setRoute);
}

function resolveCoachRouteScreen(route: ShellRoute, setRoute: (route: ShellRoute) => void): React.JSX.Element {
  const coachScreen = resolveCoachLibraryScreen(route, setRoute) ?? resolveCoachMonitoringScreen(route, setRoute);
  return coachScreen ?? <ClientsScreen onRouteChange={setRoute} />;
}

const WARMUPS_TAB = 'warmups';

function resolveCoachLibraryScreen(route: ShellRoute, setRoute: (route: ShellRoute) => void): null | React.JSX.Element {
  if (route === 'coach.library.unified') return <UnifiedExerciseLibraryScreen />;
  if (route === 'coach.library.foods') return <LibraryFoodsScreen />;
  if (route === 'coach.library.routines') return <LibraryRoutinesScreen onRouteChange={setRoute} />;
  if (route === 'coach.library.warmups') return <LibraryRoutinesScreen defaultTab={WARMUPS_TAB} onRouteChange={setRoute} />;
  if (route === 'coach.routine.planner') return <RoutinePlannerScreen onRouteChange={setRoute} />;
  if (route === 'coach.warmup.planner') return <WarmupPlannerScreen onRouteChange={setRoute} />;
  return null;
}

function resolveCoachMonitoringScreen(route: ShellRoute, setRoute: (route: ShellRoute) => void): null | React.JSX.Element {
  if (route === 'coach.home') return <CoachTriageScreen onRouteChange={setRoute} />;
  if (route === 'coach.progress') return <ProgressScreen onRouteChange={setRoute} />;
  if (route === 'coach.nutrition') return <NutritionScreen />;
  if (route === 'coach.evaluator') return <TechniqueEvaluatorScreen />;
  if (route === 'coach.incidents') return <IncidentsScreen />;
  if (route === 'coach.chat') return <ChatScreen />;
  if (route === 'coach.notes') return <NotesScreen />;
  if (route === 'coach.calendar') return <CalendarScreen />;
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

function isSupportedRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  role: 'admin' | 'coach' | null | any,
): role is 'admin' | 'coach' {
  return role === 'admin' || role === 'coach';
}
