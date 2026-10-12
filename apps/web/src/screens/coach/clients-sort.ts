export type ClientSort = 'name' | 'activity';
type SortableClient = { firstName: string; lastName: string; lastActivityAt?: string | null };
function timestamp(value: string | null | undefined): number {
  const result = value ? Date.parse(value) : NaN;
  return Number.isFinite(result) ? result : 0;
}
export function sortClients<T extends SortableClient>(clients: readonly T[], order: ClientSort): T[] {
  return [...clients].sort((a, b) => {
    const byName = (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName, 'es');
    return order === 'activity' ? timestamp(b.lastActivityAt) - timestamp(a.lastActivityAt) || byName : byName;
  });
}
