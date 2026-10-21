import { z } from 'zod';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetRecentSessionsQueryDto {
  static schema = z
    .object({
      dayIndex: z.coerce.number().int().min(1).max(365).optional(),
      category: z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']).optional(),
      beforeDate: z.string().date().optional(),
      beforeId: postgresUuidString.optional(),
      clientId: postgresUuidString.optional(),
      exerciseId: postgresUuidString.optional(),
      templateId: postgresUuidString.optional(),
      from: z.string().date(),
      to: z.string().date(),
      limit: z.coerce.number().int().min(1).max(200).optional().default(20),
    })
    .superRefine(spanWithin(PROGRESS_MAX_DAYS))
    .superRefine((value, ctx) => {
      if (!!value.beforeDate !== !!value.beforeId)
        ctx.addIssue({ code: 'custom', message: 'beforeDate and beforeId must be supplied together', path: ['beforeDate'] });
    });

  dayIndex?: number;
  category?: 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';
  beforeDate?: string;
  beforeId?: string;
  clientId?: string;
  exerciseId?: string;
  templateId?: string;
  from!: string;
  to!: string;
  limit?: number;
}
