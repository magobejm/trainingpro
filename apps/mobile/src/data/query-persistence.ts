import { persistQueryClient, type PersistedClient, type Persister } from '@tanstack/react-query-persist-client';
import type { QueryClient } from '@tanstack/react-query';
import { createAuthStateStorage } from './auth-storage';
import { useAuthStore } from '../store/auth.store';

export const QUERY_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const [root, scope, kind, extra] = queryKey;
  if (root === 'session') return true;
  if (root !== 'clients' || scope !== 'me') return false;
  if (kind === 'routine') return extra == null;
  if (kind === 'plan-days' || kind === 'calendar' || kind === 'sessions' || kind === 'neat-logs') return true;
  return kind === 'nutrition' && extra == null;
}

export function startQueryPersistence(queryClient: QueryClient, userId: string): () => void {
  const [unsubscribe] = persistQueryClient({
    dehydrateOptions: { shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey) },
    maxAge: QUERY_CACHE_MS,
    persister: createQueryPersister(userId),
    queryClient: queryClient as never,
  });
  return unsubscribe;
}

export async function clearPersistedQueryCache(userId: string | null): Promise<void> {
  if (!userId) return;
  await createAuthStateStorage().removeItem(cacheKey(userId));
}

export function persistedUserId(): string | null {
  return useAuthStore.getState().userId;
}

function createQueryPersister(userId: string): Persister {
  const storage = createAuthStateStorage();
  const key = cacheKey(userId);
  return {
    persistClient: async (client: PersistedClient) => {
      await storage.setItem(key, JSON.stringify(client));
    },
    removeClient: async () => {
      await storage.removeItem(key);
    },
    restoreClient: async () => {
      const raw = await storage.getItem(key);
      return raw ? (JSON.parse(raw) as PersistedClient) : undefined;
    },
  };
}

function cacheKey(userId: string): string {
  return `trainerpro.mobile.query.v1.${userId}`;
}
