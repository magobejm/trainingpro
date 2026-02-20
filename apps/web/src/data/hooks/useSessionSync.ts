import { useEffect } from 'react';
import { createSupabaseClient } from '../supabase-client';
import { useAuthStore } from '../../store/auth.store';

export function useSessionSync(): void {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  useEffect(() => {
    const supabase = createSupabaseClient();
    void syncInitialSession(supabase, setSession, clearSession);
    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        clearSession();
        return;
      }
      setSession(accessToken);
    });
    return () => listener.data.subscription.unsubscribe();
  }, [clearSession, setSession]);
}

async function syncInitialSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  setSession: (token: string) => void,
  clearSession: () => void,
): Promise<void> {
  const result = await supabase.auth.getSession();
  const token = result.data.session?.access_token;
  if (!token) {
    clearSession();
    return;
  }
  setSession(token);
}
