import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

const microcycleCategorySchema = z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']);

export class GetMicrocycleProgressQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    templateId: postgresUuidString.optional(),
    category: microcycleCategorySchema.optional(),
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  templateId?: string;
  category?: 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';
  from!: string;
  to!: string;
}
