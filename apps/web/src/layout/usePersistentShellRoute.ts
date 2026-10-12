import React, { useEffect, useMemo, useState } from 'react';

type AdminRoute = 'admin.coaches' | 'admin.subscription';
type CoachRoute =
  | 'coach.clients'
  | 'coach.library.cardio'
  | 'coach.library.exercises'
  | 'coach.library.unified'
  | 'coach.library.foods'
  | 'coach.library.routines'
  | 'coach.library.warmups'
  | 'coach.library.isometrics'
  | 'coach.library.plyometrics'
  | 'coach.library.mobility'
  | 'coach.library.sports'
  | 'coach.builder.cardio'
  | 'coach.builder.diet'
  | 'coach.builder.strength'
  | 'coach.routine.planner'
  | 'coach.warmup.planner'
  | 'coach.progress'
  | 'coach.nutrition'
  | 'coach.evaluator'
  | 'coach.incidents'
  | 'coach.chat'
  | 'coach.notes'
  | 'coach.calendar'
  | 'coach.notifications';

export type ShellRoute = AdminRoute | CoachRoute;

export const SHELL_ROUTES: readonly ShellRoute[] = [
  'admin.coaches',
  'admin.subscription',
  'coach.clients',
  'coach.library.cardio',
  'coach.library.exercises',
  'coach.library.unified',
  'coach.library.foods',
  'coach.library.routines',
  'coach.library.warmups',
  'coach.library.isometrics',
  'coach.library.plyometrics',
  'coach.library.mobility',
  'coach.library.sports',
  'coach.builder.cardio',
  'coach.builder.diet',
  'coach.builder.strength',
  'coach.routine.planner',
  'coach.warmup.planner',
  'coach.progress',
  'coach.nutrition',
  'coach.evaluator',
  'coach.incidents',
  'coach.chat',
  'coach.notes',
  'coach.calendar',
  'coach.notifications',
];

export type ShellNavItem = {
  icon: (props: { color: string; size: number }) => React.ReactNode;
  id: ShellRoute;
  labelKey: string;
  badgeColor?: string; // e.g. 'bg-blue-50', 'bg-emerald-50' equivalent in hex
};

const SHELL_ROUTE_STORAGE_KEY = 'trainerpro.shell.route';

export function usePersistentShellRoute(
  activeRole: 'admin' | 'coach',
  navItems: ShellNavItem[],
): [ShellRoute, (route: ShellRoute) => void] {
  const defaultRoute = useMemo(() => resolveDefaultRoute(activeRole), [activeRole]);
  const [route, setRoute] = useState<ShellRoute>(() => resolveInitialRoute(navItems, defaultRoute, activeRole));
  useEffect(() => {
    setRoute((previous) => ensureAllowedRoute(previous, navItems, defaultRoute, activeRole));
  }, [activeRole, defaultRoute, navItems]);
  useEffect(() => {
    persistRoute(route);
  }, [route]);
  return [route, setRoute];
}

function resolveInitialRoute(navItems: ShellNavItem[], defaultRoute: ShellRoute, activeRole: 'admin' | 'coach'): ShellRoute {
  const persisted = readPersistedRoute();
  if (persisted && isRouteAllowed(persisted, navItems, activeRole)) {
    return persisted;
  }
  return navItems[0]?.id ?? defaultRoute;
}

function ensureAllowedRoute(
  route: ShellRoute,
  navItems: ShellNavItem[],
  defaultRoute: ShellRoute,
  activeRole: 'admin' | 'coach',
): ShellRoute {
  if (isRouteAllowed(route, navItems, activeRole)) {
    return route;
  }
  return navItems[0]?.id ?? defaultRoute;
}

function resolveDefaultRoute(role: 'admin' | 'coach'): ShellRoute {
  if (role === 'admin') return 'admin.coaches';
  return 'coach.clients';
}

// Las subrutas válidas del rol (Progreso, Calentamientos…) no están en el menú pero sí se pueden restaurar.
export function isRouteAllowed(route: ShellRoute, navItems: ShellNavItem[], activeRole: 'admin' | 'coach'): boolean {
  return route.startsWith(`${activeRole}.`) || navItems.some((item) => item.id === route);
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
  return (SHELL_ROUTES as readonly string[]).includes(route);
}
