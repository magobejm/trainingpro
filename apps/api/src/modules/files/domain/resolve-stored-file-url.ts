import type { FileStoragePort } from './file-storage.port';

const SUPABASE_PUBLIC_OBJECT_PATH = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;

/** Extracts the object path from a Supabase public URL, or returns bare storage paths unchanged. */
export function extractStorageObjectPath(storedValue: string): string | null {
  const trimmed = storedValue.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!trimmed.startsWith('http')) {
    return trimmed;
  }
  try {
    const match = new URL(trimmed).pathname.match(SUPABASE_PUBLIC_OBJECT_PATH);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** Resolves a stored storage path or legacy Supabase URL to the current environment public URL. */
export function resolveStoredFileUrl(storedValue: string, storage?: FileStoragePort): string {
  if (!storage) {
    return storedValue;
  }
  const objectPath = extractStorageObjectPath(storedValue);
  if (objectPath) {
    return storage.getPublicUrl(objectPath);
  }
  return storedValue;
}
