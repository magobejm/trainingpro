import { clearFutureWorkoutsSchema } from '@trainerpro/shared';

export class ClearFutureWorkoutsDto {
  static schema = clearFutureWorkoutsSchema;

  dryRun?: boolean;
  clientId!: string;
  from!: string;
}
