import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import type { StateStorage } from 'zustand/middleware';
import { createAuthStateStorage } from './auth-storage';

const STORAGE_KEY = 'trainerpro.mobile.supabase';

let client: SupabaseClient | null = null;
let appStateBound = false;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createConfiguredClient();
    bindNativeAutoRefresh(client);
  }
  return client;
}

function createConfiguredClient(): SupabaseClient {
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
      detectSessionInUrl: false,
      persistSession: true,
      storage: toSupportedStorage(createAuthStateStorage()),
      storageKey: STORAGE_KEY,
    },
  });
}

function bindNativeAutoRefresh(supabase: SupabaseClient): void {
  if (appStateBound || isJestRuntime() || !isNativeRuntime()) {
    return;
  }
  appStateBound = true;
  void import('react-native').then(({ AppState }) => {
    AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
        return;
      }
      supabase.auth.stopAutoRefresh();
    });
  });
}

function toSupportedStorage(storage: StateStorage): SupportedStorage {
  return {
    getItem: (key) => storage.getItem(key),
    removeItem: async (key) => {
      await storage.removeItem(key);
    },
    setItem: async (key, value) => {
      await storage.setItem(key, value);
    },
  };
}

function isJestRuntime(): boolean {
  const env = process.env as Record<string, string | undefined>;
  return Boolean(env['JEST_WORKER_ID']);
}

function isNativeRuntime(): boolean {
  const navigator = (globalThis as { navigator?: { product?: string } }).navigator;
  return navigator?.product === 'ReactNative';
}
