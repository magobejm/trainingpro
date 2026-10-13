export const DEFERRED_DELETE_MS = 5000;

export function beginDelete(pending: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(pending);
  next.add(id);
  return next;
}

export function undoDelete(pending: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(pending);
  next.delete(id);
  return next;
}

/** Solo se llama a la API si el id sigue pendiente y nadie ha deshecho. */
export function shouldRunDelete(pending: ReadonlySet<string>, id: string, undone: boolean): boolean {
  return !undone && pending.has(id);
}

export function restoreAfterFailure(pending: ReadonlySet<string>, id: string): Set<string> {
  return undoDelete(pending, id);
}
