import type { NavGroupId, ShellNavItem, ShellRoute } from './usePersistentShellRoute';

/** Orden de los bloques del menú del coach y de sus pantallas. */
export const COACH_MENU_LAYOUT: { group: NavGroupId; routes: ShellRoute[] }[] = [
  {
    group: 'clients',
    routes: ['coach.home', 'coach.clients', 'coach.chat', 'coach.notes', 'coach.incidents', 'coach.calendar'],
  },
  {
    group: 'planning',
    routes: ['coach.routine.planner', 'coach.warmup.planner', 'coach.nutrition'],
  },
  { group: 'library', routes: ['coach.library.unified', 'coach.library.foods', 'coach.library.routines'] },
  { group: 'tools', routes: ['coach.evaluator', 'coach.notifications'] },
];

export type NavSection = { group: NavGroupId; items: ShellNavItem[] };

/** Agrupa los ítems en los bloques del menú, respetando el orden definido y omitiendo bloques vacíos. */
export function buildNavSections(items: ShellNavItem[]): NavSection[] {
  const byRoute = new Map(items.map((item) => [item.id, item]));
  const sections: NavSection[] = [];
  const placed = new Set<ShellRoute>();
  for (const layout of COACH_MENU_LAYOUT) {
    const sectionItems = layout.routes.flatMap((route) => {
      const item = byRoute.get(route);
      return item ? [item] : [];
    });
    sectionItems.forEach((item) => placed.add(item.id));
    if (sectionItems.length > 0) sections.push({ group: layout.group, items: sectionItems });
  }
  const rest = items.filter((item) => !placed.has(item.id));
  if (rest.length > 0) sections.push({ group: rest[0]?.group ?? 'admin', items: rest });
  return sections;
}

/** Texto del contador del menú: nada si no hay pendientes y "99+" si son demasiados. */
export function formatBadge(count: number | undefined): null | string {
  if (!count || count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}

/** Pantalla del menú que se resalta: el progreso de un cliente cuelga de Clientes. */
export function resolveActiveNavRoute(route: ShellRoute): ShellRoute {
  return route === 'coach.progress' ? 'coach.clients' : route;
}
