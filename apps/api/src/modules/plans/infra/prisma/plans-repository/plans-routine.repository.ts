import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, TemplateKind } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../../common/audit/audit-fields';
import { AuthContext } from '../../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../../common/prisma/prisma.service';
import {
  mapRoutineDayCreate,
  mapRoutineTemplate,
  routineTemplateInclude,
} from '../plans-routine.prisma.helpers';
import { RoutineTemplateWriteInput } from '../../../domain/routine-template.input';
import { makePlanSummary } from './plans-summary.helper';
import { PlansBaseRepository } from './plans-base.repository';

@Injectable()
export class PlansRoutineRepository extends PlansBaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createRoutineTemplate(ctx: AuthContext, input: RoutineTemplateWriteInput) {
    const m = await this.resolveCoachMembership(ctx);
    const row = await this.prisma.planTemplate.create({
      data: {
        ...buildCreateAuditFields(ctx),
        coachMembershipId: m.id,
        days: { create: input.days.map(mapRoutineDayCreate) },
        kind: TemplateKind.ROUTINE,
        name: input.name.trim(),
        organizationId: m.organizationId,
      },
      include: routineTemplateInclude(),
    });
    return mapRoutineTemplate(row);
  }

  async getRoutineTemplateById(ctx: AuthContext, id: string) {
    const m = await this.resolveCoachMembership(ctx);
    const row = await this.prisma.planTemplate.findFirst({
      include: routineTemplateInclude(),
      where: {
        id,
        archivedAt: null,
        kind: TemplateKind.ROUTINE,
        OR: [{ coachMembershipId: m.id }, { scope: LibraryItemScope.GLOBAL }],
      },
    });
    if (!row) throw new NotFoundException('Routine template not found');
    return mapRoutineTemplate(row);
  }

  async listRoutineTemplates(ctx: AuthContext, opts?: { summary?: boolean }) {
    const m = await this.resolveCoachMembership(ctx);
    const rows = await this.prisma.planTemplate.findMany({
      include: opts?.summary ? undefined : routineTemplateInclude(),
      orderBy: [{ name: 'asc' }],
      where: {
        archivedAt: null,
        kind: TemplateKind.ROUTINE,
        OR: [
          { coachMembershipId: m.id, scope: LibraryItemScope.COACH },
          { scope: LibraryItemScope.GLOBAL },
        ],
      },
    });
    return rows.map((r) => {
      if (opts?.summary) return makePlanSummary(r);
      const hydrated = r as unknown as Parameters<typeof mapRoutineTemplate>[0];
      return mapRoutineTemplate(hydrated);
    });
  }

  async updateRoutineTemplate(ctx: AuthContext, id: string, input: RoutineTemplateWriteInput) {
    const m = await this.resolveCoachMembership(ctx);
    return this.prisma.$transaction(async (tx) => {
      const cur = await tx.planTemplate.findFirst({
        where: { archivedAt: null, coachMembershipId: m.id, id },
        select: { id: true, templateVersion: true },
      });
      if (!cur) throw new NotFoundException('Routine template not found');
      await tx.planDay.deleteMany({ where: { templateId: cur.id } });
      const row = await tx.planTemplate.update({
        where: { id: cur.id },
        data: {
          ...buildUpdateAuditFields(ctx),
          days: { create: input.days.map(mapRoutineDayCreate) },
          name: input.name.trim(),
          templateVersion: cur.templateVersion + 1,
        },
        include: routineTemplateInclude(),
      });
      return mapRoutineTemplate(row);
    });
  }

  async deleteRoutineTemplate(ctx: AuthContext, id: string): Promise<void> {
    const m = await this.resolveCoachMembership(ctx);
    const cur = await this.prisma.planTemplate.findFirst({
      where: { archivedAt: null, coachMembershipId: m.id, id },
      select: { id: true },
    });
    if (!cur) throw new NotFoundException('Routine template not found');
    await this.prisma.planTemplate.update({
      where: { id: cur.id },
      data: { archivedAt: new Date() },
    });
  }
}
