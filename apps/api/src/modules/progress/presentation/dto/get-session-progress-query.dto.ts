import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

const sessionCategorySchema = z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']);

export class GetSessionProgressQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    templateId: postgresUuidString,
    dayIndex: z.coerce.number().int().min(1).max(30).optional(),
    category: sessionCategorySchema.optional(),
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  templateId!: string;
  dayIndex?: number;
  category?: 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';
  from!: string;
  to!: string;
}
