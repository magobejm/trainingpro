import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, TemplateKind } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../../common/audit/audit-fields';
import { AuthContext } from '../../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../../common/prisma/prisma.service';
import { PlanCardioTemplate } from '../../../domain/entities/cardio-template.entity';
import { PlanCardioTemplateWriteInput } from '../../../domain/plan-cardio.input';
import {
  cardioTemplateInclude,
  mapCardioDayCreate,
  mapCardioTemplate,
} from '../plans-cardio.prisma.helpers';
import { makePlanSummary } from './plans-summary.helper';
import { PlansBaseRepository } from './plans-base.repository';

@Injectable()
export class PlansCardioRepository extends PlansBaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createCardioTemplate(
    ctx: AuthContext,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate> {
    const membership = await this.resolveCoachMembership(ctx);
    const row = await this.prisma.planTemplate.create({
      data: {
        ...buildCreateAuditFields(ctx),
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

  async listCardioTemplates(
    ctx: AuthContext,
    opts?: { summary?: boolean },
  ): Promise<PlanCardioTemplate[]> {
    const m = await this.resolveCoachMembership(ctx);
    const rows = await this.prisma.planTemplate.findMany({
      include: opts?.summary ? undefined : cardioTemplateInclude(),
      orderBy: { updatedAt: 'desc' },
      where: {
        archivedAt: null,
        kind: TemplateKind.CARDIO,
        OR: [
          { coachMembershipId: m.id, scope: LibraryItemScope.COACH },
          { scope: LibraryItemScope.GLOBAL },
        ],
      },
    });
    return rows.map((r) => {
      if (opts?.summary) return makePlanSummary(r) as unknown as PlanCardioTemplate;
      const hydrated = r as unknown as Parameters<typeof mapCardioTemplate>[0];
      return mapCardioTemplate(hydrated);
    });
  }

  async getCardioTemplateById(ctx: AuthContext, id: string): Promise<PlanCardioTemplate> {
    const m = await this.resolveCoachMembership(ctx);
    const row = await this.prisma.planTemplate.findFirst({
      include: cardioTemplateInclude(),
      where: {
        id,
        archivedAt: null,
        kind: TemplateKind.CARDIO,
        OR: [{ coachMembershipId: m.id }, { scope: LibraryItemScope.GLOBAL }],
      },
    });
    if (!row) throw new NotFoundException('Cardio template not found');
    const hydrated = row as unknown as Parameters<typeof mapCardioTemplate>[0];
    return mapCardioTemplate(hydrated);
  }

  async updateCardioTemplate(
    ctx: AuthContext,
    id: string,
    input: PlanCardioTemplateWriteInput,
  ): Promise<PlanCardioTemplate> {
    const m = await this.resolveCoachMembership(ctx);
    return this.prisma.$transaction(async (tx) => {
      const cur = await tx.planTemplate.findFirst({
        where: { archivedAt: null, coachMembershipId: m.id, id },
        select: { id: true, templateVersion: true },
      });
      if (!cur) throw new NotFoundException('Cardio template not found');
      await tx.planDay.deleteMany({ where: { templateId: cur.id } });
      const row = await tx.planTemplate.update({
        where: { id: cur.id },
        data: {
          ...buildUpdateAuditFields(ctx),
          days: { create: input.days.map(mapCardioDayCreate) },
          name: input.name.trim(),
          templateVersion: cur.templateVersion + 1,
        },
        include: cardioTemplateInclude(),
      });
      return mapCardioTemplate(row);
    });
  }

  async deleteCardioTemplate(ctx: AuthContext, id: string): Promise<void> {
    const m = await this.resolveCoachMembership(ctx);
    const cur = await this.prisma.planTemplate.findFirst({
      where: { archivedAt: null, coachMembershipId: m.id, id },
      select: { id: true },
    });
    if (!cur) throw new NotFoundException('Cardio template not found');
    await this.prisma.planTemplate.update({
      where: { id: cur.id },
      data: { archivedAt: new Date() },
    });
  }
}
