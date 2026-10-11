import { z } from 'zod';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetPerformedSessionDaysQueryDto {
  static schema = z
    .object({
      clientId: postgresUuidString.optional(),
      templateId: postgresUuidString,
      from: z.string().date(),
      to: z.string().date(),
    })
    .superRefine(spanWithin(PROGRESS_MAX_DAYS));

  clientId?: string;
  templateId!: string;
  from!: string;
  to!: string;
}
