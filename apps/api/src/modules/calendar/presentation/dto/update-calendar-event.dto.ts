import { z } from 'zod';

export class UpdateCalendarEventDto {
  static schema = z.object({
    title: z.string().trim().max(200).optional(),
    content: z.string().trim().max(10000).optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    color: z.string().max(30).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  });

  title?: string;
  content?: string;
  time?: string;
  color?: string;
  date?: string;
}
