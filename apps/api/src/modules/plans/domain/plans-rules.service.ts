import { BadRequestException, Injectable } from '@nestjs/common';
import type { PlanStrengthExerciseInput, PlanTemplateWriteInput } from './plan-template.input';

@Injectable()
export class PlansRulesService {
  assertValidTemplate(input: PlanTemplateWriteInput): void {
    for (const day of input.days) {
      for (const exercise of day.exercises) {
        this.assertValidPrescription(exercise);
      }
    }
  }

  private assertValidPrescription(exercise: PlanStrengthExerciseInput): void {
    const hasRange =
      typeof exercise.weightRangeMinKg === 'number' || typeof exercise.weightRangeMaxKg === 'number';
    const hasPerSet = (exercise.perSetWeightRanges?.length ?? 0) > 0;
    if (!hasRange && !hasPerSet) {
      throw new BadRequestException(
        'Strength exercise must define weight range and/or per-set ranges',
      );
    }
  }
}
