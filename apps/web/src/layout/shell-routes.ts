import type { ShellRoute } from './usePersistentShellRoute';

/** Subpantallas de la ficha de un cliente que tienen su propia dirección: /coach/clients/:id/<modo>. */
export type ClientMode =
  | 'compare'
  | 'edit'
  | 'measures'
  | 'mood'
  | 'nutrition'
  | 'planning'
  | 'progress'
  | 'tests'
  | 'volume';

export type ParsedShellPath = {
  clientId: null | string;
  clientMode: ClientMode | null;
  route: ShellRoute;
};

export const SHELL_PATHS: Record<ShellRoute, string> = {
  'admin.coaches': '/admin/coaches',
  'admin.subscription': '/admin/subscription',
  'coach.calendar': '/coach/calendar',
  'coach.chat': '/coach/chat',
  'coach.home': '/coach/home',
  'coach.clients': '/coach/clients',
  'coach.evaluator': '/coach/evaluator',
  'coach.incidents': '/coach/incidents',
  'coach.library.foods': '/coach/library/foods',
  'coach.library.routines': '/coach/library/routines',
  'coach.library.unified': '/coach/library/exercises',
  'coach.library.warmups': '/coach/library/warmups',
  'coach.notes': '/coach/notes',
  'coach.notifications': '/coach/notifications',
  'coach.nutrition': '/coach/nutrition',
  'coach.progress': '/coach/progress',
  'coach.routine.planner': '/coach/planner/routine',
  'coach.warmup.planner': '/coach/planner/warmup',
};

const CLIENT_MODES: readonly ClientMode[] = [
  'compare',
  'edit',
  'measures',
  'mood',
  'nutrition',
  'planning',
  'progress',
  'tests',
  'volume',
];
const CLIENTS_BASE = SHELL_PATHS['coach.clients'];

const ROUTE_BY_PATH = new Map<string, ShellRoute>(
  (Object.entries(SHELL_PATHS) as [ShellRoute, string][]).map(([route, path]) => [path, route]),
);

export type RoutePathOptions = { clientId?: null | string; clientMode?: ClientMode | null };

/** Dirección de una pantalla del shell; con cliente, la de su ficha o de una de sus subpantallas. */
export function routeToPath(route: ShellRoute, options: RoutePathOptions = {}): string {
  const clientId = options.clientId?.trim();
  if (clientId && (route === 'coach.clients' || route === 'coach.progress')) {
    const mode = route === 'coach.progress' ? 'progress' : options.clientMode;
    return clientPath(clientId, mode ?? null);
  }
  return SHELL_PATHS[route];
}

export function clientPath(clientId: string, mode: ClientMode | null): string {
  const base = `${CLIENTS_BASE}/${encodeURIComponent(clientId)}`;
  return mode ? `${base}/${mode}` : base;
}

/** Interpreta una dirección; devuelve null si no es una pantalla conocida. */
export function parseShellPath(pathname: string): ParsedShellPath | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const legacy = LEGACY_PATHS[path];
  if (legacy) return { clientId: null, clientMode: null, route: legacy };
  const fixed = ROUTE_BY_PATH.get(path);
  if (fixed) return { clientId: null, clientMode: null, route: fixed };
  return parseClientPath(path);
}

const LEGACY_PATHS: Record<string, ShellRoute> = {
  '/coach/builder/cardio': 'coach.routine.planner',
  '/coach/builder/diet': 'coach.routine.planner',
  '/coach/builder/strength': 'coach.routine.planner',
  '/coach/library/cardio': 'coach.library.unified',
  '/coach/library/isometrics': 'coach.library.unified',
  '/coach/library/mobility': 'coach.library.unified',
  '/coach/library/plyometrics': 'coach.library.unified',
  '/coach/library/sports': 'coach.library.unified',
  '/coach/library/strength': 'coach.library.unified',
};

function parseClientPath(path: string): ParsedShellPath | null {
  if (!path.startsWith(`${CLIENTS_BASE}/`)) return null;
  const [rawId, rawMode, ...rest] = path.slice(CLIENTS_BASE.length + 1).split('/');
  if (!rawId || rest.length > 0) return null;
  const clientId = safeDecode(rawId);
  if (!clientId) return null;
  if (rawMode === undefined) return { clientId, clientMode: null, route: 'coach.clients' };
  const mode = CLIENT_MODES.find((item) => item === rawMode);
  if (!mode) return null;
  return { clientId, clientMode: mode, route: mode === 'progress' ? 'coach.progress' : 'coach.clients' };
}

function safeDecode(value: string): null | string {
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded || null;
  } catch {
    return null;
  }
}

export function defaultPathForRole(role: 'admin' | 'coach'): string {
  return role === 'admin' ? SHELL_PATHS['admin.coaches'] : SHELL_PATHS['coach.home'];
}

/** Un coach no puede abrir pantallas de administración y viceversa. */
export function isPathAllowedForRole(pathname: string, role: 'admin' | 'coach'): boolean {
  const parsed = parseShellPath(pathname);
  return Boolean(parsed) && parsed?.route.startsWith(`${role}.`) === true;
}
