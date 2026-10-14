import React from 'react';

type AdminRoute = 'admin.coaches' | 'admin.subscription';
type CoachRoute =
  | 'coach.clients'
  | 'coach.library.unified'
  | 'coach.library.foods'
  | 'coach.library.routines'
  | 'coach.library.warmups'
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
  'coach.library.unified',
  'coach.library.foods',
  'coach.library.routines',
  'coach.library.warmups',
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

export type NavGroupId = 'admin' | 'clients' | 'library' | 'planning' | 'tools';

export type ShellNavItem = {
  icon: (props: { color: string; size: number }) => React.ReactNode;
  id: ShellRoute;
  labelKey: string;
  badgeColor?: string; // fondo del icono en reposo
  group: NavGroupId;
  /** Clave i18n del nombre corto del menú (si falta, labelKey). */
  menuLabelKey?: string;
};

const SHELL_ROUTE_STORAGE_KEY = 'trainerpro.shell.route';

// Las subrutas válidas del rol (Progreso, Calentamientos…) no están en el menú pero sí se pueden restaurar.
export function isRouteAllowed(route: ShellRoute, navItems: ShellNavItem[], activeRole: 'admin' | 'coach'): boolean {
  return route.startsWith(`${activeRole}.`) || navItems.some((item) => item.id === route);
}

export function readPersistedRoute(): null | ShellRoute {
  if (typeof window === 'undefined') {
    return null;
  }
  const route = window.localStorage.getItem(SHELL_ROUTE_STORAGE_KEY);
  if (!route) return null;
  return isShellRoute(route) ? route : redirectLegacyRoute(route);
}

export function persistRoute(route: ShellRoute): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(SHELL_ROUTE_STORAGE_KEY, route);
}

function isShellRoute(route: string): route is ShellRoute {
  return (SHELL_ROUTES as readonly string[]).includes(route);
}

const LEGACY_ROUTES: Record<string, ShellRoute> = {
  'coach.builder.cardio': 'coach.routine.planner',
  'coach.builder.diet': 'coach.routine.planner',
  'coach.builder.strength': 'coach.routine.planner',
  'coach.library.cardio': 'coach.library.unified',
  'coach.library.exercises': 'coach.library.unified',
  'coach.library.isometrics': 'coach.library.unified',
  'coach.library.mobility': 'coach.library.unified',
  'coach.library.plyometrics': 'coach.library.unified',
  'coach.library.sports': 'coach.library.unified',
};

export function redirectLegacyRoute(route: string): ShellRoute | null {
  return LEGACY_ROUTES[route] ?? null;
}
