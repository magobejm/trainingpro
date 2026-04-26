import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, SessionStatus, TemplateKind } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { CardioIntervalLog, CardioSessionInstance } from '../../domain/cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from '../../domain/cardio-session.input';
import type { SessionInstance, SessionSetLog } from '../../domain/session.entity';
import type { EnsureSessionInput, FinishSessionInput, LogSetInput } from '../../domain/session.input';
import type { SessionsRepositoryPort } from '../../domain/sessions-repository.port';
import {
  assertSessionMutable,
  mapSessionIsometricCreate,
  mapSessionItemCreate,
  mapSessionMobilityCreate,
  mapSessionPlioCreate,
  mapSessionSportCreate,
  mapSetLog,
  readDayExercises,
  readDayIsometricBlocks,
  readDayMobilityBlocks,
  readDayPlioBlocks,
  readDaySportBlocks,
} from './sessions-prisma.mappers';
import { SessionsCardioRepositoryPrisma } from './sessions-cardio.repository.prisma';
import { mapSession, normalizeText, sessionInclude, toDecimal } from './sessions-strength.prisma.helpers';

type CoachMembership = {
  id: string;
  organizationId: string;
};

@Injectable()
export class SessionsRepositoryPrisma implements SessionsRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cardioRepository: SessionsCardioRepositoryPrisma,
  ) {}

  async canAccessSession(context: AuthContext, sessionId: string): Promise<boolean> {
    if (context.activeRole === 'admin') {
      return false;
    }
    if (context.activeRole === 'coach') {
      return this.canCoachAccessSession(context, sessionId);
    }
    return this.canClientAccessSession(context, sessionId);
  }

  ensureCardioSession(context: AuthContext, input: EnsureCardioSessionInput): Promise<CardioSessionInstance> {
    return this.cardioRepository.ensureCardioSession(context, input);
  }

  async ensureSession(context: AuthContext, input: EnsureSessionInput): Promise<SessionInstance> {
    const membership = await this.resolveCoachMembership(context);
    const existing = await this.prisma.sessionInstance.findFirst({
      where: {
        archivedAt: null,
        clientId: input.clientId,
        sessionDate: input.sessionDate,
      },
      include: sessionInclude(),
    });
    if (existing) {
      return mapSession(existing);
    }
    const template = await this.readTemplateSnapshot(input.templateId, membership.id, input.planDayId);
    const row = await this.prisma.sessionInstance.create({
      data: {
        ...buildCreateAuditFields(context),
        clientId: input.clientId,
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        sessionDate: input.sessionDate,
        sourceTemplateId: template.id,
        sourceTemplateVersion: template.templateVersion,
        planDayId: template.planDaySnapshot.planDayId,
        planDayIndex: template.planDaySnapshot.planDayIndex,
        planDayTitle: template.planDaySnapshot.planDayTitle,
        status: SessionStatus.PENDING,
        items: template.items.length > 0 ? { create: template.items.map(mapSessionItemCreate) } : undefined,
        plioBlocks: template.plioBlocks ? { create: template.plioBlocks.map(mapSessionPlioCreate) } : undefined,
        mobilityBlocks: template.mobilityBlocks
          ? { create: template.mobilityBlocks.map(mapSessionMobilityCreate) }
          : undefined,
        isometricBlocks: template.isometricBlocks
          ? { create: template.isometricBlocks.map(mapSessionIsometricCreate) }
          : undefined,
        sportBlocks: template.sportBlocks ? { create: template.sportBlocks.map(mapSessionSportCreate) } : undefined,
      },
      include: sessionInclude(),
    });
    return mapSession(row);
  }

  finishCardioSession(context: AuthContext, input: FinishSessionInput): Promise<CardioSessionInstance> {
    return this.cardioRepository.finishCardioSession(context, input);
  }

  async finishSession(context: AuthContext, input: FinishSessionInput): Promise<SessionInstance> {
    const session = await this.readSessionForMutation(input.sessionId);
    assertSessionMutable(session.status);
    const updated = await this.prisma.sessionInstance.update({
      where: { id: session.id },
      data: {
        ...buildUpdateAuditFields(context),
        finishComment: normalizeText(input.comment),
        finishedAt: new Date(),
        isCompleted: true,
        isIncomplete: input.isIncomplete,
        status: SessionStatus.COMPLETED,
      },
      include: sessionInclude(),
    });
    return mapSession(updated);
  }

  getCardioSessionById(context: AuthContext, sessionId: string): Promise<CardioSessionInstance | null> {
    return this.cardioRepository.getCardioSessionById(context, sessionId);
  }

  async getSessionById(context: AuthContext, sessionId: string): Promise<SessionInstance | null> {
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: sessionInclude(),
    });
    void context;
    return row ? mapSession(row) : null;
  }

  logInterval(context: AuthContext, input: LogIntervalInput): Promise<CardioIntervalLog> {
    return this.cardioRepository.logInterval(context, input);
  }

  async logSet(context: AuthContext, input: LogSetInput): Promise<SessionSetLog> {
    const session = await this.readSessionForMutation(input.sessionId);
    assertSessionMutable(session.status);
    const item = await this.readSessionItem(input.sessionId, input.sessionItemId);
    if (!item) {
      throw new NotFoundException('Session item not found');
    }
    const row = await this.upsertSetLog(input, item.id);
    void context;
    return mapSetLog(row);
  }

  startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance> {
    return this.cardioRepository.startCardioSession(context, sessionId);
  }

  async startSession(context: AuthContext, sessionId: string): Promise<SessionInstance> {
    const session = await this.readSessionForMutation(sessionId);
    if (session.startedAt || session.status === SessionStatus.COMPLETED) {
      return mapSession(session);
    }
    const updated = await this.prisma.sessionInstance.update({
      where: { id: session.id },
      data: {
        ...buildUpdateAuditFields(context),
        startedAt: new Date(),
        status: SessionStatus.IN_PROGRESS,
      },
      include: sessionInclude(),
    });
    return mapSession(updated);
  }

  private async canCoachAccessSession(context: AuthContext, sessionId: string) {
    const row = await this.prisma.sessionInstance.findFirst({
      where: {
        archivedAt: null,
        id: sessionId,
        coachMembership: {
          archivedAt: null,
          isActive: true,
          role: Role.COACH,
          user: { supabaseUid: context.subject },
        },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  private async canClientAccessSession(context: AuthContext, sessionId: string) {
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId, client: { email: context.email ?? '' } },
      select: { id: true },
    });
    return Boolean(row);
  }

  private async readSessionForMutation(sessionId: string) {
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: sessionInclude(),
    });
    if (!row) {
      throw new NotFoundException('Session not found');
    }
    return row;
  }

  private async readTemplateSnapshot(templateId: string, coachMembershipId: string, planDayId?: string | null) {
    const row = await this.readWorkoutTemplate(templateId, coachMembershipId);
    if (!row) {
      throw new NotFoundException('Template not found');
    }
    const days = row.days as Array<{ id: string; dayIndex: number; title: string }>;
    const firstDay = days[0];
    if (!firstDay) {
      throw new BadRequestException('Template has no days');
    }
    const resolvedPlanDayId = planDayId ?? firstDay.id;
    const planDayRow = days.find((d) => d.id === resolvedPlanDayId);
    if (!planDayRow) {
      throw new NotFoundException('Plan day not found for this template');
    }
    const exercises = readDayExercises(row.days as Parameters<typeof readDayExercises>[0], resolvedPlanDayId);
    const plioBlocks = readDayPlioBlocks(row.days as Parameters<typeof readDayPlioBlocks>[0], resolvedPlanDayId);
    const mobilityBlocks = readDayMobilityBlocks(row.days as Parameters<typeof readDayMobilityBlocks>[0], resolvedPlanDayId);
    const isometricBlocks = readDayIsometricBlocks(
      row.days as Parameters<typeof readDayIsometricBlocks>[0],
      resolvedPlanDayId,
    );
    const sportBlocks = readDaySportBlocks(row.days as Parameters<typeof readDaySportBlocks>[0], resolvedPlanDayId);
    const hasContent =
      (exercises?.length ?? 0) > 0 ||
      plioBlocks.length > 0 ||
      mobilityBlocks.length > 0 ||
      isometricBlocks.length > 0 ||
      sportBlocks.length > 0;
    if (!hasContent) {
      throw new BadRequestException('Selected template day has no workout content');
    }
    return {
      id: row.id,
      items: exercises ?? [],
      plioBlocks,
      mobilityBlocks,
      isometricBlocks,
      sportBlocks,
      templateVersion: row.templateVersion,
      planDaySnapshot: {
        planDayId: planDayRow.id,
        planDayIndex: planDayRow.dayIndex,
        planDayTitle: planDayRow.title,
      },
    };
  }

  private async resolveCoachMembership(context: AuthContext): Promise<CoachMembership> {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can create/ensure sessions');
    }
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

  private readSessionItem(sessionId: string, sessionItemId: string) {
    return this.prisma.sessionStrengthItem.findFirst({
      where: { archivedAt: null, id: sessionItemId, sessionId },
      select: { id: true },
    });
  }

  private upsertSetLog(input: LogSetInput, sessionItemId: string) {
    return this.prisma.setLog.upsert({
      where: { sessionItemId_setIndex: { sessionItemId, setIndex: input.setIndex } },
      create: {
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        sessionId: input.sessionId,
        sessionItemId,
        setIndex: input.setIndex,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
      update: {
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
    });
  }

  private readWorkoutTemplate(templateId: string, coachMembershipId: string) {
    return this.prisma.planTemplate.findFirst({
      where: {
        archivedAt: null,
        coachMembershipId,
        id: templateId,
        kind: { in: [TemplateKind.STRENGTH, TemplateKind.ROUTINE] },
      },
      include: {
        days: {
          where: { archivedAt: null },
          orderBy: { dayIndex: 'asc' },
          include: {
            exercises: {
              where: { archivedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
            plioBlocks: {
              where: { archivedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
            mobilityBlocks: {
              where: { archivedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
            isometricBlocks: {
              where: { archivedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
            sportBlocks: {
              where: { archivedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }
}
