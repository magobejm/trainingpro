import { useIncidentsQuery } from '../data/hooks/useIncidents';
import type { ShellRoute } from './usePersistentShellRoute';

export type MenuBadges = Partial<Record<ShellRoute, number>>;

/**
 * Contadores del menú. Incidencias cuenta las abiertas con la API actual.
 * Chat no tiene contador: la API no distingue mensajes leídos de no leídos.
 */
export function useCoachMenuBadges(): MenuBadges {
  const open = useIncidentsQuery({ status: 'OPEN' });
  return { 'coach.incidents': open.data?.length ?? 0 };
}
