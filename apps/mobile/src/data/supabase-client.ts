import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  // Direct `process.env.EXPO_PUBLIC_*` access so the bundler inlines it at
  // build time (native and web). Indirect access via a helper is NOT inlined.
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public env vars');
  }
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}
