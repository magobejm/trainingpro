import { useCoachTriage } from '../data/hooks/useCoachTriage';
import { useIncidentsQuery } from '../data/hooks/useIncidents';
import { totalOpenCount } from '../screens/coach/coach-triage.sections';
import type { ShellRoute } from './usePersistentShellRoute';

export type MenuBadges = Partial<Record<ShellRoute, number>>;

/**
 * Contadores del menú. Inicio suma las categorías del centro de mando que no
 * están plegadas; Chat cuenta las conversaciones con mensajes sin leer;
 * Incidencias cuenta clientes con alguna incidencia abierta.
 */
export function useCoachMenuBadges(): MenuBadges {
  const open = useIncidentsQuery({ status: 'OPEN' });
  const triage = useCoachTriage().query.data;
  return {
    'coach.chat': triage?.chat.length ?? 0,
    'coach.home': totalOpenCount(triage, triage?.collapsed ?? []),
    'coach.incidents': countClientsWithOpenIncidents(open.data ?? []),
  };
}

export function countClientsWithOpenIncidents(incidents: Array<{ clientId: string }>): number {
  return new Set(incidents.map((incident) => incident.clientId)).size;
}
