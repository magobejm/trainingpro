import type { FileStoragePort } from './file-storage.port';
import { isPrivateStoragePath, normalizeStoragePath } from './private-storage-path';

const SUPABASE_PUBLIC_OBJECT_PATH = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;

export type StoredFileUrls = {
  getPublicUrl(path: string): string;
  signPrivateUrl(path: string): string;
};

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

/** Resolves a stored path or legacy Supabase URL. Private prefixes become signed URLs. */
export function resolveStoredFileUrl(storedValue: string, urls?: StoredFileUrls): string {
  if (!urls) {
    return storedValue;
  }
  const objectPath = extractStorageObjectPath(storedValue);
  if (!objectPath) {
    return storedValue;
  }
  let normalized: string;
  try {
    normalized = normalizeStoragePath(objectPath);
  } catch {
    return storedValue;
  }
  if (isPrivateStoragePath(normalized)) {
    return urls.signPrivateUrl(normalized);
  }
  return urls.getPublicUrl(normalized);
}

export function toStoredFileUrls(storage: FileStoragePort, signer: { sign(path: string): string }): StoredFileUrls {
  return {
    getPublicUrl: (path) => storage.getPublicUrl(path),
    signPrivateUrl: (path) => signer.sign(path),
  };
}
