import { createClient } from '@supabase/supabase-js';
import { readFrontEnv } from './env';

export function createSupabaseClient() {
  const env = readFrontEnv();
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      `Missing Supabase public env vars: url=${Boolean(supabaseUrl)} key=${Boolean(anonKey)}`,
    );
  }
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
