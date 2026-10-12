import { createSupabaseClient } from './supabase-client';

export type LoginResult = {
  accessToken: string;
};

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Missing access token');
  }
  return { accessToken };
}

export type PasswordRecoveryInput = {
  accessToken: string;
  password: string;
  refreshToken: string;
};

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = createSupabaseClient();
  const redirectTo = (globalThis as { location?: { origin?: string } }).location?.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  if (error) {
    throw new Error(error.message);
  }
}

/** Abre la sesión temporal del enlace, fija la contraseña nueva y cierra esa sesión. */
export async function completePasswordRecovery(input: PasswordRecoveryInput): Promise<void> {
  const supabase = createSupabaseClient();
  const opened = await supabase.auth.setSession({ access_token: input.accessToken, refresh_token: input.refreshToken });
  if (opened.error) {
    throw new Error(opened.error.message);
  }
  const updated = await supabase.auth.updateUser({ password: input.password });
  if (updated.error) {
    throw new Error(updated.error.message);
  }
  await supabase.auth.signOut();
}

export async function logoutSession(): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
