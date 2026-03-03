/* eslint-disable max-lines-per-function */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { UpsertWarmupTemplateDto } from '../../presentation/dto/upsert-warmup-template.dto';

type Input = { items: UpsertWarmupTemplateDto['items']; name: string };
type TemplateRow = {
  coachMembershipId: null | string;
  createdAt: Date;
  id: string;
  name: string;
  scope: 'COACH' | 'GLOBAL';
  templateVersion: number;
  updatedAt: Date;
};

@Injectable()
export class WarmupTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(context: AuthContext, input: Input) {
    const membership = await this.resolveCoachMembership(context);
    const idRow = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO warmup_template (
        scope, organization_id, coach_membership_id, name, template_version, created_by, updated_by
      ) VALUES ('COACH', $1::uuid, $2::uuid, $3, 1, $4::uuid, $4::uuid)
      RETURNING id`,
      membership.organizationId,
      membership.id,
      input.name.trim(),
      context.subject,
    );
    const templateId = idRow[0]?.id;
    if (!templateId) {
      throw new NotFoundException('Warmup template could not be created');
    }
    await this.replaceItems(templateId, input.items);
    return this.getOne(context, templateId);
  }

  async list(context: AuthContext, options?: { summary?: boolean }) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.$queryRawUnsafe<TemplateRow[]>(
      `SELECT
        id,
        coach_membership_id AS "coachMembershipId",
        name,
        scope,
        template_version AS "templateVersion",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM warmup_template
      WHERE archived_at IS NULL
        AND (coach_membership_id = $1::uuid OR scope = 'GLOBAL')
      ORDER BY lower(name) ASC`,
      membership.id,
    );
    if (options?.summary) {
      return rows.map((row) => ({
        ...row,
        items: [],
      }));
    }
    return Promise.all(rows.map((row) => this.loadTemplate(row.id)));
  }

  async getOne(context: AuthContext, templateId: string) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.$queryRawUnsafe<TemplateRow[]>(
      `SELECT
        id,
        coach_membership_id AS "coachMembershipId",
        name,
        scope,
        template_version AS "templateVersion",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM warmup_template
      WHERE id = $1::uuid
        AND archived_at IS NULL
        AND (coach_membership_id = $2::uuid OR scope = 'GLOBAL')`,
      templateId,
      membership.id,
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Warmup template not found');
    }
    return this.loadTemplate(row.id);
  }

  async update(context: AuthContext, templateId: string, input: Input) {
    await this.assertMutableTemplate(context, templateId);
    await this.prisma.$executeRawUnsafe(
      `UPDATE warmup_template
       SET name = $1, template_version = template_version + 1, updated_at = now()
       WHERE id = $2::uuid`,
      input.name.trim(),
      templateId,
    );
    await this.replaceItems(templateId, input.items);
    return this.getOne(context, templateId);
  }

  async delete(context: AuthContext, templateId: string): Promise<void> {
    await this.assertMutableTemplate(context, templateId);
    await this.prisma.$executeRawUnsafe(
      `UPDATE warmup_template SET archived_at = now() WHERE id = $1::uuid`,
      templateId,
    );
  }

  private async loadTemplate(templateId: string) {
    const templates = await this.prisma.$queryRawUnsafe<TemplateRow[]>(
      `SELECT
        id,
        coach_membership_id AS "coachMembershipId",
        name,
        scope,
        template_version AS "templateVersion",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM warmup_template
      WHERE id = $1::uuid`,
      templateId,
    );
    const template = templates[0];
    if (!template) {
      throw new NotFoundException('Warmup template not found');
    }
    const items = await this.prisma.$queryRawUnsafe<unknown[]>(
      `SELECT
        block_type AS "blockType",
        cardio_method_library_id AS "cardioMethodLibraryId",
        display_name AS "displayName",
        duration_minutes AS "durationMinutes",
        exercise_library_id AS "exerciseLibraryId",
        metadata_json AS "metadataJson",
        notes,
        plio_exercise_library_id AS "plioExerciseLibraryId",
        reps_max AS "repsMax",
        reps_min AS "repsMin",
        rest_seconds AS "restSeconds",
        rounds_planned AS "roundsPlanned",
        sets_planned AS "setsPlanned",
        sort_order AS "sortOrder",
        target_rir AS "targetRir",
        target_rpe AS "targetRpe",
        warmup_exercise_library_id AS "warmupExerciseLibraryId",
        work_seconds AS "workSeconds"
      FROM warmup_template_item
      WHERE template_id = $1::uuid AND archived_at IS NULL
      ORDER BY sort_order ASC`,
      templateId,
    );
    return { ...template, items };
  }

  private async assertOwnedTemplate(context: AuthContext, templateId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id
       FROM warmup_template
       WHERE id = $1::uuid
         AND archived_at IS NULL
         AND coach_membership_id = $2::uuid`,
      templateId,
      membership.id,
    );
    if (!rows[0]?.id) {
      throw new NotFoundException('Warmup template not found');
    }
  }

  private async assertMutableTemplate(context: AuthContext, templateId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.$queryRawUnsafe<{ id: string; scope: 'COACH' | 'GLOBAL' }[]>(
      `SELECT id, scope
       FROM warmup_template
       WHERE id = $1::uuid
         AND archived_at IS NULL
         AND (coach_membership_id = $2::uuid OR scope = 'GLOBAL')`,
      templateId,
      membership.id,
    );
    const template = rows[0];
    if (!template) {
      throw new NotFoundException('Warmup template not found');
    }
    if (template.scope === 'GLOBAL') {
      throw new ForbiddenException('Global warmup templates are read-only');
    }
    await this.assertOwnedTemplate(context, templateId);
  }

  private async replaceItems(templateId: string, items: UpsertWarmupTemplateDto['items']) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM warmup_template_item WHERE template_id = $1::uuid`,
      templateId,
    );
    for (const item of items) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO warmup_template_item (
          template_id,
          block_type,
          sort_order,
          display_name,
          exercise_library_id,
          cardio_method_library_id,
          plio_exercise_library_id,
          warmup_exercise_library_id,
          sets_planned,
          reps_min,
          reps_max,
          rounds_planned,
          work_seconds,
          rest_seconds,
          target_rpe,
          target_rir,
          duration_minutes,
          notes,
          metadata_json
        ) VALUES (
          $1::uuid,$2,$3,$4,$5::uuid,$6::uuid,$7::uuid,$8::uuid,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb
        )`,
        templateId,
        item.blockType,
        item.sortOrder,
        item.displayName.trim(),
        item.exerciseLibraryId ?? null,
        item.cardioMethodLibraryId ?? null,
        item.plioExerciseLibraryId ?? null,
        item.warmupExerciseLibraryId ?? null,
        item.setsPlanned ?? null,
        item.repsMin ?? null,
        item.repsMax ?? null,
        item.roundsPlanned ?? null,
        item.workSeconds ?? null,
        item.restSeconds ?? null,
        item.targetRpe ?? null,
        item.targetRir ?? null,
        item.durationMinutes ?? null,
        item.notes ?? null,
        item.metadataJson ? JSON.stringify(item.metadataJson) : null,
      );
    }
  }

  private async resolveCoachMembership(context: AuthContext) {
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
