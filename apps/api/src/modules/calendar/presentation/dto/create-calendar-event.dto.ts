import { z } from 'zod';

export class CreateCalendarEventDto {
  static schema = z.object({
    type: z.enum(['note', 'reminder', 'workout']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    title: z.string().trim().max(200).optional(),
    content: z.string().trim().max(10000).optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    color: z.string().max(30).optional(),
    clientId: z.string().uuid().optional(),
    planDayId: z.string().uuid().optional(),
  });

  type!: 'note' | 'reminder' | 'workout';
  date!: string;
  title?: string;
  content?: string;
  time?: string;
  color?: string;
  clientId?: string;
  planDayId?: string;
}
