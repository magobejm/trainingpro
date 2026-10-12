import type { ShellRoute } from './usePersistentShellRoute';

export function resolveRouteTitleKey(route: ShellRoute): string {
  return `app.nav.${route}`;
}
