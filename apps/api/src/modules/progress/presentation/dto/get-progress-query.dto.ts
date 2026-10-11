import { z } from 'zod';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';

export class GetProgressQueryDto {
  static schema = z
    .object({
      clientId: z.string().uuid().optional(),
      from: z.string().date(),
      to: z.string().date(),
    })
    .superRefine(spanWithin(PROGRESS_MAX_DAYS));

  clientId?: string;
  from!: string;
  to!: string;
}
