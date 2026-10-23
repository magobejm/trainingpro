import type { QueryClient } from '@tanstack/react-query';
import { createApiClient } from '../../data/api-client';
import { removeSessionDraft } from '../../data/offline/session-draft';
import { useAuthStore } from '../../store/auth.store';

export type DiscardSessionClient = {
  invalidate: (sessionId: string) => Promise<void>;
  isOnline: () => boolean;
  postDiscard: (sessionId: string) => Promise<void>;
  removeDraft: (sessionId: string) => Promise<void>;
};

export async function discardStartedSession(sessionId: string, client: DiscardSessionClient): Promise<void> {
  if (!client.isOnline()) throw new Error('offline');
  await client.postDiscard(sessionId);
  await client.removeDraft(sessionId);
  await client.invalidate(sessionId);
}

export function createDiscardSessionClient(queryClient: QueryClient): DiscardSessionClient {
  return {
    invalidate: (sessionId) => invalidateDiscardedSession(queryClient, sessionId),
    isOnline: () => readOnline(),
    postDiscard: (sessionId) => postDiscard(sessionId),
    removeDraft: (id) => removeSessionDraft(id),
  };
}

function readOnline(): boolean {
  const browser = globalThis as { navigator?: { onLine?: boolean } };
  return browser.navigator?.onLine !== false;
}

async function postDiscard(sessionId: string): Promise<void> {
  const auth = useAuthStore.getState();
  if (!auth.accessToken || !auth.activeRole) throw new Error('offline');
  await createApiClient({ accessToken: auth.accessToken, activeRole: auth.activeRole }).post(
    `/sessions/${sessionId}/discard`,
    {},
  );
}

function invalidateDiscardedSession(queryClient: QueryClient, sessionId: string): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['session', sessionId] }),
    queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'sessions'] }),
    queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] }),
    queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar-summary'] }),
  ]).then(() => undefined);
}
