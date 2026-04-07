import { z } from 'zod';

export class UpdateNoteDto {
  static schema = z.object({
    content: z.string().trim().min(1).max(10000),
  });

  content!: string;
}
