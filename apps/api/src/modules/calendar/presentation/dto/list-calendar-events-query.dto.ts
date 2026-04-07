import { z } from 'zod';

export class ListCalendarEventsQueryDto {
  static schema = z.object({
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom must be YYYY-MM-DD'),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo must be YYYY-MM-DD'),
    clientId: z.string().uuid().optional(),
  });

  dateFrom!: string;
  dateTo!: string;
  clientId?: string;
}
