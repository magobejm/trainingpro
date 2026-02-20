type SupabaseStorageConfig = {
  bucket: string;
  serviceRoleKey: string;
  url: string;
};

function readRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function readSupabaseStorageConfig(): SupabaseStorageConfig {
  return {
    bucket: readRequired('SUPABASE_STORAGE_BUCKET'),
    serviceRoleKey: readRequired('SUPABASE_SERVICE_ROLE_KEY'),
    url: readRequired('SUPABASE_URL'),
  };
}
