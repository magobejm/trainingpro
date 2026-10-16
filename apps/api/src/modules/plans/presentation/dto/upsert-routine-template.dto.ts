import { z } from 'zod';
import { coachRoutineSchema, strengthSetSchema } from '@trainerpro/shared';
export class UpsertRoutineTemplateDto {
  static schema = coachRoutineSchema;
  days!: z.infer<typeof coachRoutineSchema>['days'];
  expectedCompletionDays?: null | number;
  name!: string;
  neats?: { description?: string; title: string }[];
  objectiveIds?: string[];
}
export { strengthSetSchema };
