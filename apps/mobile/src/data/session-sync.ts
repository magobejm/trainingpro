import { clearCoachDrafts } from './coach-draft-storage';
import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { usePasswordRecoveryStore } from '../store/password-recovery.store';
import { getSupabaseClient } from './supabase-client';
import { decideSessionTransition, sessionTransitionClearsUserData, type SessionTransition } from './session-transition';
import { clearPersistedQueryCache } from './query-persistence';

export { decideSessionTransition, sessionTransitionClearsUserData, type SessionTransition };

export type RecoverySessionAction = 'apply' | 'finish-restore' | 'hold';

/** Mientras el enlace de recuperación está abierto, esa sesión no entra en la app. */
export function recoverySessionAction(phase: string, event: string, status: string): RecoverySessionAction {
  if (phase === 'none' || event === 'SIGNED_OUT') {
    return 'apply';
  }
  return status === 'restoring' ? 'finish-restore' : 'hold';
}

type StoredSession = {
  access_token: string;
  user: { id: string };
} | null;

export function startSessionSync(queryClient: QueryClient): () => void {
  const supabase = getSupabaseClient();
  let ready = false;
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (!ready) {
      return;
    }
    applyStoredSession(queryClient, event, session);
  });
  void supabase.auth
    .getSession()
    .then(({ data: sessionData, error }) => {
      if (error) {
        if (!keepSessionWhileOffline(error)) signOutLocally(queryClient);
        return;
      }
      applyStoredSession(queryClient, 'INITIAL_SESSION', sessionData.session);
    })
    .catch((error: unknown) => {
      if (!keepSessionWhileOffline(error)) signOutLocally(queryClient);
    })
    .finally(() => {
      ready = true;
    });
  return () => {
    data.subscription.unsubscribe();
  };
}

function applyStoredSession(queryClient: QueryClient, event: string, session: StoredSession): void {
  const action = recoverySessionAction(usePasswordRecoveryStore.getState().phase, event, useAuthStore.getState().status);
  if (action === 'hold') {
    return;
  }
  if (action === 'finish-restore') {
    useAuthStore.getState().resetSession();
    return;
  }
  const previousUserId = useAuthStore.getState().userId;
  const userId = session?.user.id ?? null;
  const accessToken = session?.access_token ?? null;
  const identity = userId ? { userId } : null;
  const transition = decideSessionTransition(previousUserId, event, identity);
  if (transition === 'signedOut' || !accessToken || !userId) {
    signOutLocally(queryClient);
    return;
  }
  if (sessionTransitionClearsUserData(transition)) {
    clearUserData(queryClient);
  }
  useAuthStore.getState().applySession(accessToken, userId, {
    resetRoles: transition === 'switchedUser',
  });
}

function signOutLocally(queryClient: QueryClient): void {
  clearUserData(queryClient);
  useAuthStore.getState().resetSession();
}

function clearUserData(queryClient: QueryClient): void {
  void clearCoachDrafts().catch(() => undefined);
  void clearPersistedQueryCache(useAuthStore.getState().userId);
  queryClient.clear();
}

function keepSessionWhileOffline(error: unknown): boolean {
  if (useAuthStore.getState().status !== 'signedIn') return false;
  const online = (globalThis as { navigator?: { onLine?: boolean } }).navigator?.onLine;
  if (online === false) return true;
  const message = error instanceof Error ? error.message : '';
  return /network|fetch|offline/i.test(message);
}
