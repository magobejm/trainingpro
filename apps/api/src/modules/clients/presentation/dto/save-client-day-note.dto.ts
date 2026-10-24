import { z } from 'zod';

export class ClientDayNoteParamDto {
  static schema = z.object({
    date: z.string().date(),
  });

  date!: string;
}

export class ClientDayNotesQueryDto {
  static schema = z.object({
    before: z.string().date().optional(),
    query: z.string().trim().max(80).optional(),
  });

  before?: string;
  query?: string;
}

export class SaveClientDayNoteDto {
  static schema = z.object({
    content: z.string().max(2000),
  });

  content!: string;
}
