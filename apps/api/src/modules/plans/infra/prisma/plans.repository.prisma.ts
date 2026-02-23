import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, TemplateKind } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { PlanCardioTemplate } from '../../domain/entities/cardio-template.entity';
import type { PlanTemplate } from '../../domain/entities/plan-template.entity';
import type { PlanCardioTemplateWriteInput } from '../../domain/plan-cardio.input';
import type { PlanTemplateWriteInput } from '../../domain/plan-template.input';
import type { PlansRepositoryPort } from '../../domain/plans-repository.port';
import {
  cardioTemplateInclude,
  mapCardioDayCreate,
  mapCardioTemplate,
} from './plans-cardio.prisma.helpers';
import { mapDayCreate, mapTemplate, templateInclude } from './plans-strength.prisma.helpers';

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

  async deleteTemplate(context: AuthContext, templateId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const current = await this.prisma.planTemplate.findFirst({
      where: { archivedAt: null, coachMembershipId: membership.id, id: templateId },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Plan template not found');
    }
    await this.prisma.planTemplate.update({
      where: { id: current.id },
      data: { archivedAt: new Date() },
    });
  }

  async deleteCardioTemplate(context: AuthContext, templateId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const current = await this.prisma.planTemplate.findFirst({
      where: { archivedAt: null, coachMembershipId: membership.id, id: templateId },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Cardio template not found');
    }
    await this.prisma.planTemplate.update({
      where: { id: current.id },
      data: { archivedAt: new Date() },
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

  async canCoachAccessTemplate(coachSupabaseUid: string, templateId: string): Promise<boolean> {
    const template = await this.prisma.planTemplate.findFirst({
      where: {
        id: templateId,
        archivedAt: null,
        coachMembership: {
          user: { supabaseUid: coachSupabaseUid },
        },
      },
      select: { id: true },
    });
    return !!template;
  }
}
