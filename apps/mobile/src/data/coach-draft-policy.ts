export function coachContextKey(userId: string | null, role: string | null, resource: string): string {
  // SecureStore accepts only alphanumeric characters, dots, dashes and underscores.
  const tuple = JSON.stringify([userId, role, resource]);
  return (
    'tp.coach.' +
    Array.from({ length: tuple.length }, (_, index) => tuple.charCodeAt(index).toString(16).padStart(4, '0')).join('')
  );
}

export function stableDraftValue(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)));
  });
}

export function draftConflicts(baseline?: string, current?: string): boolean {
  return baseline !== undefined && current !== undefined && baseline !== current;
}
