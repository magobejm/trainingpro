import { CreatePlanDto } from './create-plan.dto';

export class UpdatePlanDto {
  static schema = CreatePlanDto.schema.partial();

  content?: unknown;
  description?: null | string;
  name?: string;
  setupData?: unknown;
  strategy?: null | string;
  type?: 'ESTRUCTURADO' | 'LIBRE';
}
