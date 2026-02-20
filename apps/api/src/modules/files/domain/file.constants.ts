export const FILE_MAX_SIZE_BYTES = 1_000_000;

export const FILE_ALLOWED_MIME_TYPES = {
  'application/pdf': 'PDF',
  'audio/aac': 'AUDIO',
  'audio/mpeg': 'AUDIO',
  'audio/mp4': 'AUDIO',
  'audio/wav': 'AUDIO',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
} as const;

export type AllowedAttachmentKind =
  (typeof FILE_ALLOWED_MIME_TYPES)[keyof typeof FILE_ALLOWED_MIME_TYPES];
