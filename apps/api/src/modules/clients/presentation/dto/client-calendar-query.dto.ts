import { z } from 'zod';
import { CALENDAR_MAX_DAYS, spanWithin, WELLNESS_MAX_DAYS } from '../../../../common/dates/date-span';

const dateFields = {
  dateFrom: z.string().date(),
  dateTo: z.string().date(),
};

export class ClientCalendarQueryDto {
  static schema = z
    .object({
      dateFrom: dateFields.dateFrom,
      dateTo: dateFields.dateTo,
    })
    .superRefine(spanWithin(CALENDAR_MAX_DAYS));

  dateFrom!: string;
  dateTo!: string;
}

export class ClientWellnessQueryDto {
  static schema = z
    .object({
      dateFrom: dateFields.dateFrom,
      dateTo: dateFields.dateTo,
    })
    .superRefine(spanWithin(WELLNESS_MAX_DAYS));

  dateFrom!: string;
  dateTo!: string;
}
