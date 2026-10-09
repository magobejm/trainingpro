import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { getSupabaseClient } from './supabase-client';

let refreshedAccessToken: string | null = null;
let refreshTask: Promise<boolean> | null = null;

export async function loginWithPassword(email: string, password: string): Promise<void> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  if (!data.session?.access_token) {
    throw new Error('Missing access token');
  }
}

export async function logout(): Promise<void> {
  await unregisterCurrentPushToken();
  refreshedAccessToken = null;
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
  if (error) {
    useAuthStore.getState().resetSession();
  }
}

export async function handleUnauthorized(): Promise<void> {
  const currentToken = useAuthStore.getState().accessToken;
  if (!currentToken || currentToken === refreshedAccessToken) {
    await logout();
    return;
  }
  const refreshed = await refreshOnce();
  if (!refreshed) {
    await logout();
  }
}

function refreshOnce(): Promise<boolean> {
  if (refreshTask) {
    return refreshTask;
  }
  refreshTask = refreshAndRemember().finally(() => {
    refreshTask = null;
  });
  return refreshTask;
}

async function unregisterCurrentPushToken(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const auth = useAuthStore.getState();
  if (!auth.accessToken || (auth.activeRole !== 'coach' && auth.activeRole !== 'client')) {
    return;
  }
  try {
    const mod = await import('./push-registration');
    await Promise.race([
      mod.unregisterPushToken({ accessToken: auth.accessToken, activeRole: auth.activeRole }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    return;
  }
}

async function refreshAndRemember(): Promise<boolean> {
  const { data, error } = await getSupabaseClient().auth.refreshSession();
  const nextToken = data.session?.access_token;
  if (error || !nextToken) {
    return false;
  }
  refreshedAccessToken = nextToken;
  return true;
}
