const LIST_PREFIX = 'trainerpro.list.';
const CLIENT_PARAM = 'client';

export type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

export const LIST_KEYS = {
  calendar: 'calendar',
  chat: 'chat',
  clients: 'clients',
  incidents: 'incidents',
  libraryCardio: 'library.cardio',
  libraryExercises: 'library.exercises',
  libraryFoods: 'library.foods',
  libraryIsometric: 'library.isometric',
  libraryMobility: 'library.mobility',
  libraryPlio: 'library.plio',
  libraryRoutines: 'library.routines',
  librarySports: 'library.sports',
  libraryUnified: 'library.unified',
  libraryWarmups: 'library.warmups',
  notes: 'notes',
  nutrition: 'nutrition',
  progress: 'progress',
} as const;

export function readListContext<T>(key: string, storage: StorageLike | null = activeStorage()): T | null {
  if (!storage) return null;
  const raw = storage.getItem(storageKey(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeListContext<T>(key: string, value: T, storage: StorageLike | null = activeStorage()): void {
  if (!storage) return;
  storage.setItem(storageKey(key), JSON.stringify(value));
}

export function clearStoredClientSelection(key: string, patch: Record<string, unknown>): void {
  const stored = readListContext<Record<string, unknown>>(key);
  if (!stored) return;
  writeListContext(key, { ...stored, ...patch });
}

export function contextForClient<T extends { clientId: string }>(stored: T | null, clientId: string): T | null {
  if (!stored || !clientId || stored.clientId !== clientId) return null;
  return stored;
}

export function restoreListContext<T>(key: string, initial: T, storage: StorageLike | null): T {
  return readListContext<T>(key, storage) ?? initial;
}

export function clientIdFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get(CLIENT_PARAM);
  return id && id.trim() ? id : null;
}

export function searchWithClient(search: string, clientId: string | null): string {
  const params = new URLSearchParams(search);
  if (clientId) params.set(CLIENT_PARAM, clientId);
  else params.delete(CLIENT_PARAM);
  const next = params.toString();
  return next ? `?${next}` : '';
}

export function readRouteClientId(): string | null {
  if (typeof window === 'undefined') return null;
  return clientIdFromSearch(window.location.search);
}

export function writeRouteClientId(clientId: string | null): void {
  if (typeof window === 'undefined') return;
  const next = searchWithClient(window.location.search, clientId);
  if (next === window.location.search) return;
  const url = `${window.location.pathname}${next}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', url);
}

function storageKey(key: string): string {
  return `${LIST_PREFIX}${key}`;
}

function activeStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}
