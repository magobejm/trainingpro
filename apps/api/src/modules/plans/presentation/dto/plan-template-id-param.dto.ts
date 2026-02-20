import { z } from 'zod';

export class PlanTemplateIdParamDto {
  static schema = z.object({
    templateId: z.string().uuid(),
  });

  templateId!: string;
}
