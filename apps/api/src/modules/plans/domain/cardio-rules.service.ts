import { BadRequestException, Injectable } from '@nestjs/common';
import type { PlanCardioBlockInput, PlanCardioTemplateWriteInput } from './plan-cardio.input';

@Injectable()
export class CardioRulesService {
  assertValidTemplate(input: PlanCardioTemplateWriteInput): void {
    if (input.name.trim().length === 0) {
      throw new BadRequestException('Template name cannot be empty');
    }
    for (const day of input.days) {
      this.assertValidDay(day.cardioBlocks);
    }
  }

  private assertValidDay(blocks: PlanCardioBlockInput[]): void {
    if (blocks.length === 0) {
      throw new BadRequestException('Cardio day must include at least one block');
    }
    for (const block of blocks) {
      this.assertValidBlock(block);
    }
  }

  private assertValidBlock(block: PlanCardioBlockInput): void {
    if (block.workSeconds <= 0) {
      throw new BadRequestException('workSeconds must be greater than zero');
    }
    if ((block.restSeconds ?? 0) < 0) {
      throw new BadRequestException('restSeconds cannot be negative');
    }
    if ((block.roundsPlanned ?? 1) <= 0) {
      throw new BadRequestException('roundsPlanned must be greater than zero');
    }
    if (!isDistanceAllowed(block.methodType) && block.targetDistanceMeters != null) {
      throw new BadRequestException('Selected cardio method does not support distance target');
    }
  }
}

function isDistanceAllowed(methodType: null | string | undefined): boolean {
  if (!methodType) {
    return true;
  }
  const normalized = methodType.trim().toUpperCase();
  return normalized !== 'HIIT' && normalized !== 'TABATA';
}
