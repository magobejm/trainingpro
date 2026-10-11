import { z } from 'zod';
import { CALENDAR_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';

export class ListCalendarEventsQueryDto {
  static schema = z
    .object({
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom must be YYYY-MM-DD'),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo must be YYYY-MM-DD'),
      clientId: z.string().uuid().optional(),
      coachOnly: z.enum(['true', 'false']).optional(),
    })
    .superRefine(spanWithin(CALENDAR_MAX_DAYS));

  dateFrom!: string;
  dateTo!: string;
  clientId?: string;
  coachOnly?: string;
}
