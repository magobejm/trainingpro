const CONTENT_TYPES: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  wav: 'audio/wav',
  webp: 'image/webp',
};

const BLOCKED_CONTENT_TYPES = new Set(['application/javascript', 'image/svg+xml', 'text/html']);

export function contentTypeForPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

export function safeDownloadContentType(value: string | undefined, path: string): string {
  const raw = (value ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (!raw || raw === 'application/octet-stream') {
    return contentTypeForPath(path);
  }
  if (BLOCKED_CONTENT_TYPES.has(raw)) {
    return 'application/octet-stream';
  }
  return raw;
}
