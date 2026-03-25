import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { AuthContext } from '../../../../common/auth-context/auth-context';
import { PlanCardioTemplate } from '../../domain/entities/cardio-template.entity';
import { PlanTemplate } from '../../domain/entities/plan-template.entity';
import { PlanCardioTemplateWriteInput } from '../../domain/plan-cardio.input';
import { PlanTemplateWriteInput } from '../../domain/plan-template.input';
import { PlansRepositoryPort } from '../../domain/plans-repository.port';
import { RoutineTemplateWriteInput } from '../../domain/routine-template.input';
import { PlansCardioRepository } from './plans-repository/plans-cardio.repository';
import { PlansRoutineRepository } from './plans-repository/plans-routine.repository';
import { PlansStrengthRepository } from './plans-repository/plans-strength.repository';

@Injectable()
export class PlansRepositoryPrisma implements PlansRepositoryPort {
  private readonly cardio: PlansCardioRepository;
  private readonly routine: PlansRoutineRepository;
  private readonly strength: PlansStrengthRepository;

  constructor(prisma: PrismaService) {
    this.cardio = new PlansCardioRepository(prisma);
    this.routine = new PlansRoutineRepository(prisma);
    this.strength = new PlansStrengthRepository(prisma);
  }

  createCardioTemplate(ctx: AuthContext, i: PlanCardioTemplateWriteInput): Promise<PlanCardioTemplate> {
    return this.cardio.createCardioTemplate(ctx, i);
  }

  createTemplate(ctx: AuthContext, i: PlanTemplateWriteInput): Promise<PlanTemplate> {
    return this.strength.createTemplate(ctx, i);
  }

  listTemplates(ctx: AuthContext, o?: { summary?: boolean }): Promise<PlanTemplate[]> {
    return this.strength.listTemplates(ctx, o);
  }

  listCardioTemplates(ctx: AuthContext, o?: { summary?: boolean }): Promise<PlanCardioTemplate[]> {
    return this.cardio.listCardioTemplates(ctx, o);
  }

  getCardioTemplateById(ctx: AuthContext, id: string): Promise<PlanCardioTemplate> {
    return this.cardio.getCardioTemplateById(ctx, id);
  }

  updateTemplate(ctx: AuthContext, id: string, i: PlanTemplateWriteInput): Promise<PlanTemplate> {
    return this.strength.updateTemplate(ctx, id, i);
  }

  updateCardioTemplate(ctx: AuthContext, id: string, i: PlanCardioTemplateWriteInput): Promise<PlanCardioTemplate> {
    return this.cardio.updateCardioTemplate(ctx, id, i);
  }

  deleteTemplate(ctx: AuthContext, id: string): Promise<void> {
    return this.strength.deleteTemplate(ctx, id);
  }

  deleteCardioTemplate(ctx: AuthContext, id: string): Promise<void> {
    return this.cardio.deleteCardioTemplate(ctx, id);
  }

  canCoachAccessTemplate(coach: string, id: string): Promise<boolean> {
    return this.strength.canCoachAccessTemplate(coach, id);
  }

  getTemplateById(ctx: AuthContext, id: string): Promise<PlanTemplate> {
    return this.strength.getTemplateById(ctx, id);
  }

  createRoutineTemplate(ctx: AuthContext, i: RoutineTemplateWriteInput) {
    return this.routine.createRoutineTemplate(ctx, i);
  }

  getRoutineTemplateById(ctx: AuthContext, id: string) {
    return this.routine.getRoutineTemplateById(ctx, id);
  }

  listRoutineTemplates(ctx: AuthContext, o?: { summary?: boolean }) {
    return this.routine.listRoutineTemplates(ctx, o);
  }

  updateRoutineTemplate(ctx: AuthContext, id: string, i: RoutineTemplateWriteInput) {
    return this.routine.updateRoutineTemplate(ctx, id, i);
  }

  deleteRoutineTemplate(ctx: AuthContext, id: string): Promise<void> {
    return this.routine.deleteRoutineTemplate(ctx, id);
  }

  listRoutineObjectives() {
    return this.routine.listRoutineObjectives();
  }
}
