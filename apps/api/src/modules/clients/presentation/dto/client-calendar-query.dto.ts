import { z } from 'zod';

export class ClientCalendarQueryDto {
  static schema = z.object({
    dateFrom: z.string().date(),
    dateTo: z.string().date(),
  });

  dateFrom!: string;
  dateTo!: string;
}
