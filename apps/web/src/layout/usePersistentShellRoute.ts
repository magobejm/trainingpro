import { useEffect, useMemo, useState } from 'react';

type AdminRoute = 'admin.coaches' | 'admin.subscription';
type CoachRoute =
  | 'coach.clients'
  | 'coach.library.cardio'
  | 'coach.library.exercises'
  | 'coach.library.foods'
  | 'coach.library.plyometrics'
  | 'coach.library.warmup'
  | 'coach.library.sports'
  | 'coach.builder.cardio'
  | 'coach.builder.diet'
  | 'coach.builder.strength'
  | 'coach.routine.planner'
  | 'coach.progress'
  | 'coach.evaluator'
  | 'coach.incidents'
  | 'coach.chat'
  | 'coach.notifications';

export type ShellRoute = AdminRoute | CoachRoute;

export type ShellNavItem = {
  icon: string;
  id: ShellRoute;
  labelKey: string;
};

const SHELL_ROUTE_STORAGE_KEY = 'trainerpro.shell.route';

export function usePersistentShellRoute(
  activeRole: 'admin' | 'client' | 'coach',
  navItems: ShellNavItem[],
): [ShellRoute, (route: ShellRoute) => void] {
  const defaultRoute = useMemo(() => resolveDefaultRoute(activeRole), [activeRole]);
  const [route, setRoute] = useState<ShellRoute>(() => resolveInitialRoute(navItems, defaultRoute));
  useEffect(() => {
    setRoute((previous) => ensureAllowedRoute(previous, navItems, defaultRoute));
  }, [defaultRoute, navItems]);
  useEffect(() => {
    persistRoute(route);
  }, [route]);
  return [route, setRoute];
}

function resolveInitialRoute(navItems: ShellNavItem[], defaultRoute: ShellRoute): ShellRoute {
  const persisted = readPersistedRoute();
  if (persisted && isRouteAllowed(persisted, navItems)) {
    return persisted;
  }
  return navItems[0]?.id ?? defaultRoute;
}

function ensureAllowedRoute(
  route: ShellRoute,
  navItems: ShellNavItem[],
  defaultRoute: ShellRoute,
): ShellRoute {
  if (isRouteAllowed(route, navItems)) {
    return route;
  }
  return navItems[0]?.id ?? defaultRoute;
}

function resolveDefaultRoute(role: 'admin' | 'client' | 'coach'): ShellRoute {
  return role === 'admin' ? 'admin.coaches' : 'coach.clients';
}

function isRouteAllowed(route: ShellRoute, navItems: ShellNavItem[]): boolean {
  return navItems.some((item) => item.id === route);
}

function readPersistedRoute(): null | ShellRoute {
  if (typeof window === 'undefined') {
    return null;
  }
  const route = window.localStorage.getItem(SHELL_ROUTE_STORAGE_KEY);
  if (!route || !isShellRoute(route)) {
    return null;
  }
  return route;
}

function persistRoute(route: ShellRoute): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(SHELL_ROUTE_STORAGE_KEY, route);
}

function isShellRoute(route: string): route is ShellRoute {
  return (
    route === 'admin.coaches' ||
    route === 'admin.subscription' ||
    route === 'coach.clients' ||
    route === 'coach.library.cardio' ||
    route === 'coach.library.exercises' ||
    route === 'coach.library.foods' ||
    route === 'coach.library.plyometrics' ||
    route === 'coach.library.warmup' ||
    route === 'coach.library.sports' ||
    route === 'coach.builder.cardio' ||
    route === 'coach.builder.diet' ||
    route === 'coach.builder.strength' ||
    route === 'coach.routine.planner' ||
    route === 'coach.progress' ||
    route === 'coach.evaluator' ||
    route === 'coach.incidents' ||
    route === 'coach.chat' ||
    route === 'coach.notifications'
  );
}
