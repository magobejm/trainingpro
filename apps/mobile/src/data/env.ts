export type FrontEnv = {
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
};

export function readFrontEnv(): FrontEnv {
  const scope = globalThis as { process?: { env?: FrontEnv } };
  return scope.process?.env ?? {};
}
