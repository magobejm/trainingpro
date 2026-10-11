import { z } from 'zod';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetRecentSessionsQueryDto {
  static schema = z
    .object({
      clientId: postgresUuidString.optional(),
      exerciseId: postgresUuidString.optional(),
      templateId: postgresUuidString.optional(),
      from: z.string().date(),
      to: z.string().date(),
      limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    })
    .superRefine(spanWithin(PROGRESS_MAX_DAYS));

  clientId?: string;
  exerciseId?: string;
  templateId?: string;
  from!: string;
  to!: string;
  limit?: number;
}
