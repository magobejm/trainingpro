import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  type ProgressRepositoryPort,
  PROGRESS_REPOSITORY,
} from '../../domain/progress-repository.port';
import { aggregateCardioWeekly } from '../../domain/metrics/cardio-weekly.metric';
import { aggregateSrpeWeekly } from '../../domain/metrics/srpe';
import { aggregateStrengthWeekly } from '../../domain/metrics/strength-weekly.metric';

type Input = {
  clientId?: string;
  from: Date;
  to: Date;
};

@Injectable()
export class GetProgressOverviewUseCase {
  constructor(
    @Inject(PROGRESS_REPOSITORY)
    private readonly repository: ProgressRepositoryPort,
  ) {}

  async execute(context: AuthContext, input: Input) {
    const [strengthRows, cardioRows, srpeRows] = await Promise.all([
      this.repository.readStrengthLogs(context, input),
      this.repository.readCardioLogs(context, input),
      this.repository.readSessionSrpeRows(context, input),
    ]);
    return {
      cardioWeekly: aggregateCardioWeekly(cardioRows),
      srpeWeekly: aggregateSrpeWeekly(srpeRows),
      strengthWeekly: aggregateStrengthWeekly(strengthRows),
    };
  }
}
