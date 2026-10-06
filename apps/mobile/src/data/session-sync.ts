import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { getSupabaseClient } from './supabase-client';
import { decideSessionTransition, sessionTransitionClearsUserData, type SessionTransition } from './session-transition';

export { decideSessionTransition, sessionTransitionClearsUserData, type SessionTransition };

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
        signOutLocally(queryClient);
        return;
      }
      applyStoredSession(queryClient, 'INITIAL_SESSION', sessionData.session);
    })
    .catch(() => {
      signOutLocally(queryClient);
    })
    .finally(() => {
      ready = true;
    });
  return () => {
    data.subscription.unsubscribe();
  };
}

function applyStoredSession(queryClient: QueryClient, event: string, session: StoredSession): void {
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
  queryClient.clear();
}
