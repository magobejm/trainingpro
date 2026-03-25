import { Inject, Injectable } from '@nestjs/common';
import { PLANS_REPOSITORY, type PlansRepositoryPort } from '../../domain/plans-repository.port';

@Injectable()
export class ListRoutineObjectivesUseCase {
  constructor(@Inject(PLANS_REPOSITORY) private readonly repository: PlansRepositoryPort) {}

  async execute() {
    const rows = await this.repository.listRoutineObjectives();
    return rows.map((r) => ({
      code: r.code,
      id: r.id,
      isDefault: r.is_default,
      label: r.label,
      sortOrder: r.sort_order,
    }));
  }
}
