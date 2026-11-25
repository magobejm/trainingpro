/** Qué consultas refrescar tras escribir en una ruta; una ruta desconocida refresca todo lo del coach. */
export function coachQueryRootsForPath(path: string): string[] {
  const root = path.split('?')[0]?.split('/').filter(Boolean)[0];
  if (root === 'clients') return ['coach', 'clients'];
  if (root === 'chat') return ['chat-messages'];
  if (root === 'calendar') return ['calendar'];
  if (root === 'nutrition') return ['nutrition'];
  return ['coach', 'clients', 'chat-messages', 'calendar', 'nutrition'];
}
