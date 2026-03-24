import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Prisma, TemplateKind } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../../common/audit/audit-fields';
import { AuthContext } from '../../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../../common/prisma/prisma.service';
import {
  emptyRoutineMetadata,
  mapRoutineDayCreate,
  type RoutineTemplateMetadata,
  mapRoutineTemplate,
  routineTemplateInclude,
} from '../plans-routine.prisma.helpers';
import { RoutineTemplateWriteInput } from '../../../domain/routine-template.input';
import { makePlanSummary } from './plans-summary.helper';
import { PlansBaseRepository } from './plans-base.repository';

type RoutineMetadataRow = {
  expected_completion_days: null | number;
  objective_code: null | string;
  objective_id: null | string;
  objective_is_default: null | boolean;
  objective_label: null | string;
  objective_sort_order: null | number;
  template_id: string;
};

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
    await this.persistRoutineMetadata(this.prisma, row.id, input);
    const metadataByTemplate = await this.loadRoutineMetadata([row.id]);
    return mapRoutineTemplate(row, metadataByTemplate.get(row.id));
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
    const metadataByTemplate = await this.loadRoutineMetadata([row.id]);
    return mapRoutineTemplate(row, metadataByTemplate.get(row.id));
  }

  async listRoutineTemplates(ctx: AuthContext, opts?: { summary?: boolean }) {
    const m = await this.resolveCoachMembership(ctx);
    const rows = await this.prisma.planTemplate.findMany({
      include: opts?.summary ? undefined : routineTemplateInclude(),
      orderBy: [{ name: 'asc' }],
      where: {
        archivedAt: null,
        kind: TemplateKind.ROUTINE,
        OR: [{ coachMembershipId: m.id, scope: LibraryItemScope.COACH }, { scope: LibraryItemScope.GLOBAL }],
      },
    });
    const metadataByTemplate = await this.loadRoutineMetadata(rows.map((item) => item.id));
    return rows.map((r) => {
      if (opts?.summary) return makePlanSummary(r);
      const hydrated = r as unknown as Parameters<typeof mapRoutineTemplate>[0];
      return mapRoutineTemplate(hydrated, metadataByTemplate.get(r.id));
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
      await this.persistRoutineMetadata(tx, row.id, input);
      const metadataByTemplate = await this.loadRoutineMetadata([row.id]);
      return mapRoutineTemplate(row, metadataByTemplate.get(row.id));
    });
  }

  async deleteRoutineTemplate(ctx: AuthContext, id: string): Promise<void> {
    const m = await this.resolveCoachMembership(ctx);
    const cur = await this.prisma.planTemplate.findFirst({
      where: { archivedAt: null, coachMembershipId: m.id, id },
      select: { id: true },
    });
    if (!cur) throw new NotFoundException('Routine template not found');
    const activeAssignments = await this.prisma.client.count({
      where: {
        archivedAt: null,
        coachMembershipId: m.id,
        trainingPlanId: cur.id,
      },
    });
    if (activeAssignments > 0) {
      throw new BadRequestException('Routine template is assigned to clients');
    }
    await this.prisma.planTemplate.update({
      where: { id: cur.id },
      data: { archivedAt: new Date() },
    });
  }

  private async loadRoutineMetadata(templateIds: string[]): Promise<Map<string, RoutineTemplateMetadata>> {
    if (templateIds.length === 0) {
      return new Map();
    }
    const rows = await this.queryRoutineMetadata(templateIds);
    return this.groupRoutineMetadata(rows, templateIds);
  }

  private queryRoutineMetadata(templateIds: string[]): Promise<RoutineMetadataRow[]> {
    const idsAsSql = templateIds.map((id) => Prisma.sql`${id}::uuid`);
    return this.prisma.$queryRaw<RoutineMetadataRow[]>(Prisma.sql`
      SELECT
        pt.id AS template_id,
        pt.expected_completion_days,
        pto.objective_id,
        co.code AS objective_code,
        co.label AS objective_label,
        co.sort_order AS objective_sort_order,
        co.is_default AS objective_is_default
      FROM plan_template pt
      LEFT JOIN plan_template_objective pto ON pto.template_id = pt.id
      LEFT JOIN client_objective co ON co.id = pto.objective_id
      WHERE pt.id IN (${Prisma.join(idsAsSql)})
      ORDER BY co.sort_order ASC NULLS LAST, co.label ASC NULLS LAST
    `);
  }

  private groupRoutineMetadata(rows: RoutineMetadataRow[], templateIds: string[]): Map<string, RoutineTemplateMetadata> {
    const map = this.createMetadataMap(templateIds);
    rows.forEach((row) => {
      const current = map.get(row.template_id) ?? emptyRoutineMetadata();
      this.mergeMetadataRow(current, row);
      map.set(row.template_id, current);
    });
    return map;
  }

  private createMetadataMap(templateIds: string[]): Map<string, RoutineTemplateMetadata> {
    const map = new Map<string, RoutineTemplateMetadata>();
    templateIds.forEach((templateId) => map.set(templateId, emptyRoutineMetadata()));
    return map;
  }

  private mergeMetadataRow(current: RoutineTemplateMetadata, row: RoutineMetadataRow): void {
    if (typeof row.expected_completion_days === 'number') {
      current.expectedCompletionDays = row.expected_completion_days;
    }
    if (row.objective_id && row.objective_code && row.objective_label) {
      current.objectiveIds.push(row.objective_id);
      current.objectives.push({
        code: row.objective_code,
        id: row.objective_id,
        isDefault: Boolean(row.objective_is_default),
        label: row.objective_label,
        sortOrder: row.objective_sort_order ?? 0,
      });
    }
  }

  private async persistRoutineMetadata(
    tx: Prisma.TransactionClient | PrismaService,
    templateId: string,
    input: RoutineTemplateWriteInput,
  ): Promise<void> {
    const expectedCompletionDays = input.expectedCompletionDays ?? null;
    await tx.$executeRaw`
      UPDATE plan_template
      SET expected_completion_days = ${expectedCompletionDays}
      WHERE id = ${templateId}::uuid
    `;
    await tx.$executeRaw`
      DELETE FROM plan_template_objective
      WHERE template_id = ${templateId}::uuid
    `;
    const objectiveIds = input.objectiveIds ?? [];
    for (const objectiveId of objectiveIds) {
      await tx.$executeRaw`
        INSERT INTO plan_template_objective (template_id, objective_id)
        VALUES (${templateId}::uuid, ${objectiveId}::uuid)
      `;
    }
    await tx.$executeRaw`
      DELETE FROM plan_template_neat
      WHERE template_id = ${templateId}::uuid
    `;
    const neats = input.neats ?? [];
    for (let i = 0; i < neats.length; i++) {
      const neat = neats[i]!;
      await tx.$executeRaw`
        INSERT INTO plan_template_neat (id, template_id, title, description, sort_order)
        VALUES (gen_random_uuid(), ${templateId}::uuid, ${neat.title}, ${neat.description ?? null}, ${i})
      `;
    }
  }
}
