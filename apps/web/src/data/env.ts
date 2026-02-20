export type FrontEnv = {
  EXPO_PUBLIC_API_BASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
};

export function readFrontEnv(): FrontEnv {
  return {
    ...readViteEnv(),
    ...readProcessEnv(),
  };
}

function readViteEnv(): FrontEnv {
  return {
    EXPO_PUBLIC_API_BASE_URL: import.meta.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_URL: import.meta.env.EXPO_PUBLIC_SUPABASE_URL,
  };
}

function readProcessEnv(): FrontEnv {
  const scope = globalThis as { process?: { env?: FrontEnv } };
  return scope.process?.env ?? {};
}
