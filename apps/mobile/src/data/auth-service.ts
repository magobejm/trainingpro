import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { resolvePasswordResetRedirect } from './password-reset-redirect';
import { getSupabaseClient } from './supabase-client';

export type PasswordRecoveryInput = {
  accessToken: string;
  password: string;
  refreshToken: string;
};

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

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = resolvePasswordResetRedirect(Platform.OS, (path) => Linking.createURL(path));
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw new Error(error.message);
  }
}

/** Abre la sesión temporal del enlace, fija la contraseña nueva y cierra esa sesión. */
export async function completePasswordRecovery(input: PasswordRecoveryInput): Promise<void> {
  const supabase = getSupabaseClient();
  const opened = await supabase.auth.setSession({
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
  });
  if (opened.error) {
    throw new Error(opened.error.message);
  }
  const updated = await supabase.auth.updateUser({ password: input.password });
  if (updated.error) {
    throw new Error(updated.error.message);
  }
  await supabase.auth.signOut();
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
    await mod.unregisterPushToken({ accessToken: auth.accessToken, activeRole: auth.activeRole });
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
