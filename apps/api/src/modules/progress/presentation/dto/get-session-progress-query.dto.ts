import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetSessionProgressQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    templateId: postgresUuidString,
    dayIndex: z.coerce.number().int().min(1).max(30).optional(),
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  templateId!: string;
  dayIndex?: number;
  from!: string;
  to!: string;
}
