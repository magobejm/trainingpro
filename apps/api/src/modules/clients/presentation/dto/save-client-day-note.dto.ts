import { z } from 'zod';

export class ClientDayNoteParamDto {
  static schema = z.object({
    date: z.string().date(),
  });

  date!: string;
}

export class SaveClientDayNoteDto {
  static schema = z.object({
    content: z.string().max(2000),
  });

  content!: string;
}
