import { clearFutureWorkoutsSchema } from '@trainerpro/shared';

export class ClearFutureWorkoutsDto {
  static schema = clearFutureWorkoutsSchema;

  dryRun?: boolean;
  candidateTemplateId?: string;
  clientId!: string;
  from!: string;
}
