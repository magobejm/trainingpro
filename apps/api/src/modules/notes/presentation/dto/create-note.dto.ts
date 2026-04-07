import { z } from 'zod';

export class CreateNoteDto {
  static schema = z.object({
    type: z.enum(['general', 'client']),
    clientId: z.string().uuid().optional(),
    content: z.string().trim().min(1).max(10000),
  });

  type!: 'client' | 'general';
  clientId?: string;
  content!: string;
}
