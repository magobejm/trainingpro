import { z } from 'zod';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetPerformedTemplatesQueryDto {
  static schema = z
    .object({
      clientId: postgresUuidString.optional(),
      from: z.string().date(),
      to: z.string().date(),
    })
    .superRefine(spanWithin(PROGRESS_MAX_DAYS));

  clientId?: string;
  from!: string;
  to!: string;
}
