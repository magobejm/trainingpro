import { z } from 'zod';
import { assertPrivateStoragePath } from '../../../files/domain/private-storage-path';

const attachmentSchema = z.object({
  fileName: z.string().min(1).max(160),
  kind: z.enum(['AUDIO', 'IMAGE', 'PDF']),
  mimeType: z.string().min(3).max(120),
  publicUrl: z.string().url().nullable().optional(),
  sizeBytes: z.number().int().positive(),
  storagePath: z.string().min(3).max(500),
});

export class SendChatMessageDto {
  static schema = z
    .object({
      attachments: z.array(attachmentSchema).max(5).optional(),
      text: z.string().max(2000).optional(),
      threadId: z.string().uuid(),
    })
    .superRefine((value, ctx) => {
      (value.attachments ?? []).forEach((attachment, index) => {
        if (!attachmentBelongsToThread(attachment.storagePath, value.threadId)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Attachment path must stay inside this chat thread',
            path: ['attachments', index, 'storagePath'],
          });
        }
      });
    });

  attachments?: Array<{
    fileName: string;
    kind: 'AUDIO' | 'IMAGE' | 'PDF';
    mimeType: string;
    publicUrl?: null | string;
    sizeBytes: number;
    storagePath: string;
  }>;
  text?: string;
  threadId!: string;
}

function attachmentBelongsToThread(storagePath: string, threadId: string): boolean {
  try {
    return assertPrivateStoragePath(storagePath).startsWith(`chat/${threadId}/`);
  } catch {
    return false;
  }
}
