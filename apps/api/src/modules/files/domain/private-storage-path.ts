const PRIVATE_PREFIXES = ['clients/', 'chat/'];

export function normalizeStoragePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.length === 0 || normalized.includes('\0')) {
    throw new Error('Invalid storage path');
  }
  const parts = normalized.split('/');
  if (parts.some((part) => part.length === 0 || part === '.' || part === '..')) {
    throw new Error('Invalid storage path');
  }
  return parts.join('/');
}

export function isPrivateStoragePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function assertPrivateStoragePath(path: string): string {
  const normalized = normalizeStoragePath(path);
  if (!isPrivateStoragePath(normalized)) {
    throw new Error('Invalid private storage path');
  }
  return normalized;
}
