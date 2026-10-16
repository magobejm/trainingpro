import { z } from 'zod';
import { coachWarmupSchema } from '@trainerpro/shared';
export class UpsertWarmupTemplateDto {
  static schema = coachWarmupSchema;
  groups!: z.infer<typeof coachWarmupSchema>['groups'];
  items!: z.infer<typeof coachWarmupSchema>['items'];
  name!: string;
}
