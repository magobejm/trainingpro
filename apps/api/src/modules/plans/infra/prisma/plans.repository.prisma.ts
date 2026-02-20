import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FieldMode, Prisma, Role, TemplateKind } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { PlanCardioTemplate } from '../../domain/entities/cardio-template.entity';
import type { PlanTemplate } from '../../domain/entities/plan-template.entity';
import type { PlanCardioTemplateWriteInput } from '../../domain/plan-cardio.input';
import type {
  PlanStrengthExerciseInput,
  PlanTemplateDayInput,
  PlanTemplateWriteInput,
} from '../../domain/plan-template.input';
import type { PlansRepositoryPort } from '../../domain/plans-repository.port';
import {
  cardioTemplateInclude,
  mapCardioDayCreate,
  mapCardioTemplate,
} from './plans-cardio.prisma.helpers';

type CoachMembership = {
  id: string;
  organizationId: string;
};

@Injectable()
export class PlansRepositoryPrisma implements PlansRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createCardioTemplate(
    context: AuthContext,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.planTemplate.create({
      data: {
        ...buildCreateAuditFields(context),
        coachMembershipId: membership.id,
        days: { create: input.days.map(mapCardioDayCreate) },
        kind: TemplateKind.CARDIO,
        name: input.name.trim(),
        organizationId: membership.organizationId,
      },
      include: cardioTemplateInclude(),
    });
    return mapCardioTemplate(row);
  }

  async createTemplate(context: AuthContext, input: PlanTemplateWriteInput): Promise<PlanTemplate> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.planTemplate.create({
      data: {
        ...buildCreateAuditFields(context),
        coachMembershipId: membership.id,
        kind: TemplateKind.STRENGTH,
        name: input.name.trim(),
        organizationId: membership.organizationId,
        days: { create: input.days.map(mapDayCreate) },
      },
      include: templateInclude(),
    });
    return mapTemplate(row);
  }

  async listTemplates(context: AuthContext): Promise<PlanTemplate[]> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.planTemplate.findMany({
      include: templateInclude(),
      orderBy: { updatedAt: 'desc' },
      where: { archivedAt: null, coachMembershipId: membership.id, kind: TemplateKind.STRENGTH },
    });
    return rows.map(mapTemplate);
  }

  async listCardioTemplates(context: AuthContext): Promise<PlanCardioTemplate[]> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.planTemplate.findMany({
      include: cardioTemplateInclude(),
      orderBy: { updatedAt: 'desc' },
      where: { archivedAt: null, coachMembershipId: membership.id, kind: TemplateKind.CARDIO },
    });
    return rows.map(mapCardioTemplate);
  }

  async updateTemplate(
    context: AuthContext,
    templateId: string,
    input: PlanTemplateWriteInput,
  ): Promise<PlanTemplate> {
    const membership = await this.resolveCoachMembership(context);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.planTemplate.findFirst({
        where: { archivedAt: null, coachMembershipId: membership.id, id: templateId },
        select: { id: true, templateVersion: true },
      });
      if (!current) {
        throw new NotFoundException('Plan template not found');
      }
      await tx.planDay.deleteMany({ where: { templateId: current.id } });
      const row = await tx.planTemplate.update({
        where: { id: current.id },
        data: {
          ...buildUpdateAuditFields(context),
          name: input.name.trim(),
          templateVersion: current.templateVersion + 1,
          days: { create: input.days.map(mapDayCreate) },
        },
        include: templateInclude(),
      });
      return mapTemplate(row);
    });
  }

  async updateCardioTemplate(
    context: AuthContext,
    templateId: string,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate> {
    const membership = await this.resolveCoachMembership(context);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.planTemplate.findFirst({
        where: { archivedAt: null, coachMembershipId: membership.id, id: templateId },
        select: { id: true, templateVersion: true },
      });
      if (!current) {
        throw new NotFoundException('Cardio template not found');
      }
      await tx.planDay.deleteMany({ where: { templateId: current.id } });
      const row = await tx.planTemplate.update({
        where: { id: current.id },
        data: {
          ...buildUpdateAuditFields(context),
          days: { create: input.days.map(mapCardioDayCreate) },
          name: input.name.trim(),
          templateVersion: current.templateVersion + 1,
        },
        include: cardioTemplateInclude(),
      });
      return mapCardioTemplate(row);
    });
  }

  private async resolveCoachMembership(context: AuthContext): Promise<CoachMembership> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: context.subject },
      },
      select: { id: true, organizationId: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }
}

function mapDayCreate(day: PlanTemplateDayInput): Prisma.PlanDayCreateWithoutTemplateInput {
  return {
    dayIndex: day.dayIndex,
    title: day.title.trim(),
    exercises: { create: day.exercises.map(mapExerciseCreate) },
  };
}

function mapExerciseCreate(
  exercise: PlanStrengthExerciseInput,
): Prisma.PlanStrengthExerciseCreateWithoutDayInput {
  return {
    displayName: exercise.displayName.trim(),
    fieldModes: {
      create: exercise.fieldModes.map((entry) => ({
        fieldKey: entry.fieldKey.trim(),
        mode: entry.mode as FieldMode,
      })),
    },
    libraryExercise: connectExercise(exercise.exerciseLibraryId),
    notes: normalizeText(exercise.notes),
    perSetWeightRangesJson: normalizePerSetRanges(exercise),
    repsMax: exercise.repsMax ?? null,
    repsMin: exercise.repsMin ?? null,
    setsPlanned: exercise.setsPlanned ?? null,
    sortOrder: exercise.sortOrder,
    weightRangeMaxKg: toDecimal(exercise.weightRangeMaxKg),
    weightRangeMinKg: toDecimal(exercise.weightRangeMinKg),
  };
}

function connectExercise(exerciseLibraryId: null | string | undefined) {
  if (!exerciseLibraryId) {
    return undefined;
  }
  return { connect: { id: exerciseLibraryId } };
}

function normalizePerSetRanges(
  exercise: PlanStrengthExerciseInput,
): Prisma.InputJsonValue | undefined {
  if (!exercise.perSetWeightRanges || exercise.perSetWeightRanges.length === 0) {
    return undefined;
  }
  return exercise.perSetWeightRanges.map((entry) => ({
    maxKg: entry.maxKg ?? null,
    minKg: entry.minKg ?? null,
  })) as Prisma.InputJsonValue;
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toDecimal(value: null | number | undefined) {
  return typeof value === 'number' ? new Prisma.Decimal(value) : null;
}

function mapTemplate(
  row: Prisma.PlanTemplateGetPayload<{ include: ReturnType<typeof templateInclude> }>,
): PlanTemplate {
  return {
    createdAt: row.createdAt,
    days: row.days.map(mapTemplateDay),
    id: row.id,
    name: row.name,
    templateVersion: row.templateVersion,
    updatedAt: row.updatedAt,
  };
}

function mapTemplateDay(
  day: Prisma.PlanDayGetPayload<{
    include: { exercises: { include: { fieldModes: true } } };
  }>,
) {
  return {
    dayIndex: day.dayIndex,
    exercises: day.exercises.map(mapTemplateExercise),
    id: day.id,
    title: day.title,
  };
}

function mapTemplateExercise(
  exercise: Prisma.PlanStrengthExerciseGetPayload<{ include: { fieldModes: true } }>,
) {
  return {
    displayName: exercise.displayName,
    exerciseLibraryId: exercise.exerciseLibraryId,
    fieldModes: exercise.fieldModes.map((entry) => ({
      fieldKey: entry.fieldKey,
      mode: entry.mode,
    })),
    id: exercise.id,
    notes: exercise.notes,
    prescription: {
      defaultWeightRange: {
        maxKg: toNumber(exercise.weightRangeMaxKg),
        minKg: toNumber(exercise.weightRangeMinKg),
      },
      perSetWeightRanges: readPerSetRanges(exercise.perSetWeightRangesJson),
      repsMax: exercise.repsMax,
      repsMin: exercise.repsMin,
      setsPlanned: exercise.setsPlanned,
    },
    sortOrder: exercise.sortOrder,
  };
}

function readPerSetRanges(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    const item = entry as { maxKg?: number | null; minKg?: number | null };
    return { maxKg: item.maxKg ?? null, minKg: item.minKg ?? null };
  });
}

function templateInclude() {
  return {
    days: {
      include: {
        exercises: {
          include: { fieldModes: true },
          orderBy: { sortOrder: 'asc' as const },
          where: { archivedAt: null },
        },
      },
      orderBy: { dayIndex: 'asc' as const },
      where: { archivedAt: null },
    },
  };
}

function toNumber(value: Prisma.Decimal | null): null | number {
  return value ? Number(value) : null;
}
