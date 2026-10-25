export const CHAT_ATTACHMENT_MAX_BYTES = 1_000_000;
export const CHAT_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export const CHAT_ATTACHMENT_ACCEPT = [
  'application/pdf',
  'audio/aac',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
].join(',');

const MIME_BY_EXTENSION: Record<string, string> = {
  aac: 'audio/aac',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
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
  const mimeType = resolveMimeType(file.mimeType, file.name);
  if (!mimeType) {
    return null;
  }
  const maxBytes = mimeType.startsWith('video/') ? CHAT_VIDEO_MAX_BYTES : CHAT_ATTACHMENT_MAX_BYTES;
  if (file.sizeBytes !== null && (file.sizeBytes <= 0 || file.sizeBytes > maxBytes)) {
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
