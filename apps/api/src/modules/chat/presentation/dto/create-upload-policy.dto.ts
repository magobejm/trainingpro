import { z } from 'zod';

export class CreateUploadPolicyDto {
  static schema = z.object({
    fileName: z.string().min(1).max(160),
    mimeType: z.string().min(3).max(120),
    sizeBytes: z.number().int().positive(),
    threadId: z.string().uuid(),
  });

  fileName!: string;
  mimeType!: string;
  sizeBytes!: number;
  threadId!: string;
}
