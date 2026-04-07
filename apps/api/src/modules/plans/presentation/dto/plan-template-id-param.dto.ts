import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class PlanTemplateIdParamDto {
  static schema = z.object({
    templateId: postgresUuidString,
  });

  templateId!: string;
}
