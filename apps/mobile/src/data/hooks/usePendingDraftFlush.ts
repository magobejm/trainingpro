import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SESSION_FLUSH_INTERVAL_MS, requestSessionFlush } from './useSessionDraft';
import { readPendingSessionIds } from '../offline/session-draft';

export function usePendingDraftFlush(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const flush = () => {
      void flushPendingDrafts(queryClient);
    };
    flush();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') flush();
    });
    const browser = globalThis as {
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };
    browser.addEventListener?.('online', flush);
    const timer = setInterval(flush, SESSION_FLUSH_INTERVAL_MS);
    return () => {
      subscription.remove();
      browser.removeEventListener?.('online', flush);
      clearInterval(timer);
    };
  }, [queryClient]);
}

async function flushPendingDrafts(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  const ids = await readPendingSessionIds();
  await Promise.all(ids.map((sessionId) => requestSessionFlush(sessionId, queryClient)));
}
