export const ALLOWED_BODY_DIFFS: Record<string, string> = {
  'chat.messages': 'la página pasa a ser la de los 50 mensajes más recientes',
  'clients.list': 'la lista deja de incluir las fotos de progreso',
  'library.exercises.all': 'el listado se limita al ámbito global y al del entrenador, con un select reducido',
};

export function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stable(item));
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) sorted[key] = stable(source[key]);
  return sorted;
}

export function diffBodies(before: unknown, after: unknown, path = ''): string[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (Array.isArray(before) && Array.isArray(after)) {
    if (before.length !== after.length) return [`${path || '/'} length ${before.length} -> ${after.length}`];
    return before.flatMap((item, index) => diffBodies(item, after[index], `${path}/${index}`)).slice(0, 12);
  }
  if (isObject(before) && isObject(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    return keys.flatMap((key) => diffBodies(before[key], after[key], `${path}/${key}`)).slice(0, 12);
  }
  return [`${path || '/'} changed`];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
