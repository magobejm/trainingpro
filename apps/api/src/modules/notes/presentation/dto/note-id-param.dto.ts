import { z } from 'zod';

export class NoteIdParamDto {
  static schema = z.object({
    noteId: z.string().uuid(),
  });

  noteId!: string;
}
