import { useEffect } from 'react';
import { createSupabaseClient } from '../supabase-client';
import { useAuthStore } from '../../store/auth.store';

export function useSessionSync(): void {
  const setSession = useAuthStore((state) => state.setSession);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  useEffect(() => {
    const supabase = createSupabaseClient();
    void syncInitialSession(supabase, setSession, clearSession, refreshToken);
    const listener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearSession();
        return;
      }
      const accessToken = session?.access_token;
      if (!accessToken) return;

      // If there's already a session active, ANY incoming auth event is a
      // background token refresh — use refreshToken() to avoid resetting activeRole.
      // Only use setSession() when starting from no session (fresh login).
      const hadSession = Boolean(useAuthStore.getState().accessToken);
      if (hadSession) {
        refreshToken(accessToken);
      } else {
        setSession(accessToken);
      }
    });
    return () => listener.data.subscription.unsubscribe();
  }, [clearSession, refreshToken, setSession]);
}

async function syncInitialSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  setSession: (token: string) => void,
  clearSession: () => void,
  refreshToken: (token: string) => void,
): Promise<void> {
  const result = await supabase.auth.getSession();
  const token = result.data.session?.access_token;
  if (!token) {
    clearSession();
    return;
  }
  // On page load: if already hydrated from localStorage (has a persisted token),
  // only refresh to avoid dropping activeRole. Otherwise do a full setSession.
  const hadPersistedSession = Boolean(useAuthStore.getState().accessToken);
  if (hadPersistedSession) {
    refreshToken(token);
  } else {
    setSession(token);
  }
}
