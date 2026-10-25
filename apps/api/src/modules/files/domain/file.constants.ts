export const FILE_MAX_SIZE_BYTES = 1_000_000;
export const VIDEO_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export const FILE_ALLOWED_MIME_TYPES = {
  'application/pdf': 'PDF',
  'audio/aac': 'AUDIO',
  'audio/mpeg': 'AUDIO',
  'audio/mp4': 'AUDIO',
  'audio/wav': 'AUDIO',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/quicktime': 'VIDEO',
} as const;

export type AllowedAttachmentKind = (typeof FILE_ALLOWED_MIME_TYPES)[keyof typeof FILE_ALLOWED_MIME_TYPES];

export function maxSizeForKind(kind: AllowedAttachmentKind): number {
  return kind === 'VIDEO' ? VIDEO_MAX_SIZE_BYTES : FILE_MAX_SIZE_BYTES;
}
