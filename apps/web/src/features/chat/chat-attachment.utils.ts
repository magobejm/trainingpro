export const CHAT_ATTACHMENT_MAX_BYTES = 1_000_000;

export const CHAT_ATTACHMENT_ACCEPT = [
  'application/pdf',
  'audio/aac',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'image/jpeg',
  'image/png',
  'image/webp',
].join(',');

const MIME_BY_EXTENSION: Record<string, string> = {
  aac: 'audio/aac',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  wav: 'audio/wav',
  webp: 'image/webp',
};

const ALLOWED = new Set(CHAT_ATTACHMENT_ACCEPT.split(','));

export function acceptChatFile(file: {
  mimeType: string;
  name: string;
  sizeBytes: number | null;
}): { mimeType: string } | null {
  if (file.sizeBytes !== null && (file.sizeBytes <= 0 || file.sizeBytes > CHAT_ATTACHMENT_MAX_BYTES)) {
    return null;
  }
  const mimeType = resolveMimeType(file.mimeType, file.name);
  if (!mimeType) {
    return null;
  }
  return { mimeType };
}

function resolveMimeType(rawMime: string, fileName: string): string | null {
  const normalized = rawMime.split(';')[0]?.trim().toLowerCase() ?? '';
  if (ALLOWED.has(normalized)) {
    return normalized;
  }
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const fromExtension = MIME_BY_EXTENSION[extension] ?? '';
  return ALLOWED.has(fromExtension) ? fromExtension : null;
}
