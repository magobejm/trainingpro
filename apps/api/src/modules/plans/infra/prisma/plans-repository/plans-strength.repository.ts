import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, TemplateKind } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../../common/audit/audit-fields';
import { AuthContext } from '../../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../../common/prisma/prisma.service';
import { PlanTemplate } from '../../../domain/entities/plan-template.entity';
import { PlanTemplateWriteInput } from '../../../domain/plan-template.input';
import { mapDayCreate, mapTemplate, templateInclude } from '../plans-strength.prisma.helpers';
import { makePlanSummary } from './plans-summary.helper';
import { PlansBaseRepository } from './plans-base.repository';

@Injectable()
export class PlansStrengthRepository extends PlansBaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createTemplate(ctx: AuthContext, input: PlanTemplateWriteInput): Promise<PlanTemplate> {
    const m = await this.resolveCoachMembership(ctx);
    const row = await this.prisma.planTemplate.create({
      data: {
        ...buildCreateAuditFields(ctx),
        coachMembershipId: m.id,
        kind: TemplateKind.STRENGTH,
        name: input.name.trim(),
        organizationId: m.organizationId,
        days: { create: input.days.map(mapDayCreate) },
      },
      include: templateInclude(),
    });
    return mapTemplate(row);
  }

  async listTemplates(ctx: AuthContext, opts?: { summary?: boolean }): Promise<PlanTemplate[]> {
    const m = await this.resolveCoachMembership(ctx);
    const rows = await this.prisma.planTemplate.findMany({
      include: opts?.summary ? undefined : templateInclude(),
      orderBy: { updatedAt: 'desc' },
      where: {
        archivedAt: null,
        kind: TemplateKind.STRENGTH,
        OR: [
          { coachMembershipId: m.id, scope: LibraryItemScope.COACH },
          { scope: LibraryItemScope.GLOBAL },
        ],
      },
    });
    return rows.map((r) => {
      if (opts?.summary) return makePlanSummary(r) as unknown as PlanTemplate;
      const hydrated = r as unknown as Parameters<typeof mapTemplate>[0];
      return mapTemplate(hydrated);
    });
  }

  async getTemplateById(ctx: AuthContext, id: string): Promise<PlanTemplate> {
    const m = await this.resolveCoachMembership(ctx);
    const row = await this.prisma.planTemplate.findFirst({
      include: templateInclude(),
      where: {
        id,
        archivedAt: null,
        OR: [{ coachMembershipId: m.id }, { scope: LibraryItemScope.GLOBAL }],
      },
    });
    if (!row) throw new NotFoundException('Template not found');
    const hydrated = row as unknown as Parameters<typeof mapTemplate>[0];
    return mapTemplate(hydrated);
  }

  async updateTemplate(
    ctx: AuthContext,
    id: string,
    input: PlanTemplateWriteInput,
  ): Promise<PlanTemplate> {
    const m = await this.resolveCoachMembership(ctx);
    return this.prisma.$transaction(async (tx) => {
      const cur = await tx.planTemplate.findFirst({
        where: { archivedAt: null, coachMembershipId: m.id, id },
        select: { id: true, templateVersion: true },
      });
      if (!cur) throw new NotFoundException('Plan template not found');
      await tx.planDay.deleteMany({ where: { templateId: cur.id } });
      const row = await tx.planTemplate.update({
        where: { id: cur.id },
        data: {
          ...buildUpdateAuditFields(ctx),
          name: input.name.trim(),
          templateVersion: cur.templateVersion + 1,
          days: { create: input.days.map(mapDayCreate) },
        },
        include: templateInclude(),
      });
      return mapTemplate(row);
    });
  }

  async deleteTemplate(ctx: AuthContext, id: string): Promise<void> {
    const m = await this.resolveCoachMembership(ctx);
    const cur = await this.prisma.planTemplate.findFirst({
      where: { archivedAt: null, coachMembershipId: m.id, id },
      select: { id: true },
    });
    if (!cur) throw new NotFoundException('Plan template not found');
    await this.prisma.planTemplate.update({
      where: { id: cur.id },
      data: { archivedAt: new Date() },
    });
  }

  async canCoachAccessTemplate(coachSupabaseUid: string, templateId: string): Promise<boolean> {
    const template = await this.prisma.planTemplate.findFirst({
      where: {
        id: templateId,
        archivedAt: null,
        coachMembership: { user: { supabaseUid: coachSupabaseUid } },
      },
      select: { id: true },
    });
    return !!template;
  }
}
