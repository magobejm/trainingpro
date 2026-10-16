import { stableDraftValue } from '../../data/coach-draft-policy';

/** Missing resources also conflict: a deleted item must never be recreated by an edit. */
export function coachRevisionMatches(expected: unknown, current: unknown): boolean {
  return current != null && stableDraftValue(expected) === stableDraftValue(current);
}

export async function findCoachResource<T extends { id: string }>(
  id: string,
  load: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>,
): Promise<T | undefined> {
  let cursor: string | undefined;
  const visited = new Set<string>();
  do {
    const page = await load(cursor);
    const found = page.data.find((item) => item.id === id);
    if (found) return found;
    cursor = page.nextCursor;
    if (cursor && visited.has(cursor)) throw new Error('Repeated notes cursor');
    if (cursor) visited.add(cursor);
  } while (cursor);
  return undefined;
}
export const findCoachNote = findCoachResource;
