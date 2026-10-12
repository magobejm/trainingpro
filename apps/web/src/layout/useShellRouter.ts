import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { readRouteClientId } from './list-context';
import { defaultPathForRole, isPathAllowedForRole, parseShellPath, routeToPath, type ParsedShellPath } from './shell-routes';
import { persistRoute, readPersistedRoute, type ShellRoute } from './usePersistentShellRoute';
import { useProgressContextStore } from '../store/progressContext.store';

type Role = 'admin' | 'coach';

export type GoToOptions = {
  /** Con false (clic en el menú) se entra en la pantalla sin arrastrar el cliente de la actual. */
  withClient?: boolean;
};

/** Dirección a la que ir al entrar en "/" o en una dirección que no existe o no es del rol. */
export function resolveInitialPath(role: Role): string {
  const persisted = readPersistedRoute();
  const path = persisted ? routeToPath(persisted) : null;
  return path && isPathAllowedForRole(path, role) ? path : defaultPathForRole(role);
}

/** Pantalla del shell según la dirección del navegador, y cómo navegar entre pantallas. */
export function useShellRouter(role: Role): {
  goTo: (route: ShellRoute, options?: GoToOptions) => void;
  parsed: null | ParsedShellPath;
  redirectTo: null | string;
} {
  const location = useLocation();
  const navigate = useNavigate();
  const allowed = isPathAllowedForRole(location.pathname, role);
  const parsed = allowed ? parseShellPath(location.pathname) : null;
  const route = parsed?.route ?? null;
  useEffect(() => {
    if (route) persistRoute(route);
  }, [route]);
  const goTo = useCallback(
    (target: ShellRoute, options?: GoToOptions) => {
      const clientId = options?.withClient === false ? null : resolveClientForRoute(target);
      navigate({ pathname: routeToPath(target, { clientId }), search: window.location.search });
    },
    [navigate],
  );
  return { goTo, parsed, redirectTo: allowed ? null : resolveInitialPath(role) };
}

/** Qué cliente acompaña a la pantalla de destino cuando se navega desde otra pantalla. */
function resolveClientForRoute(target: ShellRoute): null | string {
  if (target === 'coach.progress') return useProgressContextStore.getState().clientId ?? readRouteClientId();
  if (target === 'coach.clients') return readRouteClientId();
  return null;
}
