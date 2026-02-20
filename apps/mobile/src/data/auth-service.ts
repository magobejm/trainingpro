import { createSupabaseClient } from './supabase-client';

export type LoginResult = {
  accessToken: string;
};

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginResult> {
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
