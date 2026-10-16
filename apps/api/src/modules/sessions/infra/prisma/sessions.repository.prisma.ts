import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SessionStatus } from '@prisma/client';
import { buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { exerciseHistoryQuery, mapExerciseHistory } from './exercise-history';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { CardioIntervalLog, CardioSessionInstance } from '../../domain/cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from '../../domain/cardio-session.input';
import type {
  ExerciseHistoryEntry,
  SessionInstance,
  SessionIsometricSetLog,
  SessionMobilitySetLog,
  SessionPlioSetLog,
  SessionSetLog,
  SessionSportLog,
  SessionSportSetLog,
} from '../../domain/session.entity';
import type {
  EnsureSessionInput,
  EnsureSessionForClientInput,
  FinishSessionInput,
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
  LogSportSetInput,
  StartSessionInput,
} from '../../domain/session.input';
import type { SessionsRepositoryPort } from '../../domain/sessions-repository.port';
import { finishIfOpen } from './session-concurrency';
import { closeStaleSessions } from './session-stale';
import { withLockedSession } from './session-lock';
import { persistEnsuredSession } from './session-ensure';
import {
  assertSessionMutable,
  mapIsometricSetLog,
  mapMobilitySetLog,
  mapPlioSetLog,
  mapSetLog,
  mapSportLog,
  mapSportSetLog,
  mapTemplateExerciseSnapshot,
  mapTemplateIsometricSnapshot,
  mapTemplateMobilitySnapshot,
  mapTemplatePlioSnapshot,
  mapTemplateSportSnapshot,
} from './sessions-prisma.mappers';
import { SessionsCardioRepositoryPrisma } from './sessions-cardio.repository.prisma';
import { mapSessionWithGroups, normalizeText, sessionInclude } from './sessions-strength.prisma.helpers';
import {
  readWorkoutTemplate,
  upsertIsometricSetLog,
  upsertMobilitySetLog,
  upsertPlioSetLog,
  upsertSetLog,
  upsertSportLog,
  upsertSportSetLog,
} from './sessions-strength.prisma.upserts';

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
    return this.createSessionFromTemplate(context, input, membership);
  }

  async ensureSessionForClient(context: AuthContext, input: EnsureSessionForClientInput): Promise<SessionInstance> {
    const membership: CoachMembership = {
      id: input.coachMembershipId,
      organizationId: input.organizationId,
    };
    return this.createSessionFromTemplate(context, input, membership);
  }

  private async createSessionFromTemplate(
    context: AuthContext,
    input: EnsureSessionInput,
    membership: CoachMembership,
  ): Promise<SessionInstance> {
    const row = await persistEnsuredSession(this.prisma, context, input, membership, (tx) =>
      this.readTemplateSnapshot(tx, input.templateId, membership.id, input.planDayId),
    );
    return mapSessionWithGroups(this.prisma, row);
  }

  finishCardioSession(context: AuthContext, input: FinishSessionInput): Promise<CardioSessionInstance> {
    return this.cardioRepository.finishCardioSession(context, input);
  }

  async findExerciseHistory(
    clientId: string,
    sourceExerciseId: string,
    limit: number,
    excludeSessionId?: string,
  ): Promise<ExerciseHistoryEntry[]> {
    const rows = await this.prisma.sessionInstance.findMany(
      exerciseHistoryQuery(clientId, sourceExerciseId, limit, excludeSessionId),
    );
    return rows.map(mapExerciseHistory);
  }

  async finishSession(context: AuthContext, input: FinishSessionInput): Promise<SessionInstance> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      if (session.skippedAt) throw new BadRequestException('Session marked as skipped');
      const row = await finishIfOpen(
        session,
        input,
        async () => {
          const updated = await db.sessionInstance.updateMany({
            where: { id: session.id, status: { not: SessionStatus.COMPLETED } },
            data: {
              ...buildUpdateAuditFields(context),
              finishComment: normalizeText(input.comment),
              finishedAt: new Date(),
              isCompleted: true,
              isIncomplete: input.isIncomplete,
              postFatigue: input.postFatigue ?? null,
              postMood: input.postMood ?? null,
              postPain: input.postPain ?? null,
              sessionRpe: input.sessionRpe ?? null,
              status: SessionStatus.COMPLETED,
            },
          });
          return updated.count;
        },
        () => this.readSessionForMutation(input.sessionId, db),
      );
      return mapSessionWithGroups(db, row);
    });
  }

  getCardioSessionById(context: AuthContext, sessionId: string): Promise<CardioSessionInstance | null> {
    return this.cardioRepository.getCardioSessionById(context, sessionId);
  }

  async getSessionById(context: AuthContext, sessionId: string): Promise<SessionInstance | null> {
    await closeStaleSessions(this.prisma, { sessionId });
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: sessionInclude(),
    });
    void context;
    return row ? mapSessionWithGroups(this.prisma, row) : null;
  }

  logInterval(context: AuthContext, input: LogIntervalInput): Promise<CardioIntervalLog | null> {
    return this.cardioRepository.logInterval(context, input);
  }

  async logPlioSet(context: AuthContext, input: LogPlioSetInput): Promise<null | SessionPlioSetLog> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      assertSessionMutable(session.status, session.skippedAt);
      const block = await db.sessionPlioBlock.findFirst({
        where: { archivedAt: null, id: input.sessionPlioBlockId, sessionId: input.sessionId },
        select: { id: true },
      });
      if (!block) throw new NotFoundException('Plio block not found');
      const row = await upsertPlioSetLog(db, input, block.id);
      void context;
      return row ? mapPlioSetLog(row) : null;
    });
  }

  async logMobilitySet(context: AuthContext, input: LogMobilitySetInput): Promise<null | SessionMobilitySetLog> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      assertSessionMutable(session.status, session.skippedAt);
      const block = await db.sessionMobilityBlock.findFirst({
        where: { archivedAt: null, id: input.sessionMobilityBlockId, sessionId: input.sessionId },
        select: { id: true },
      });
      if (!block) throw new NotFoundException('Mobility block not found');
      const row = await upsertMobilitySetLog(db, input, block.id);
      void context;
      return row ? mapMobilitySetLog(row) : null;
    });
  }

  async logIsometricSet(context: AuthContext, input: LogIsometricSetInput): Promise<null | SessionIsometricSetLog> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      assertSessionMutable(session.status, session.skippedAt);
      const block = await db.sessionIsometricBlock.findFirst({
        where: { archivedAt: null, id: input.sessionIsometricBlockId, sessionId: input.sessionId },
        select: { id: true },
      });
      if (!block) throw new NotFoundException('Isometric block not found');
      const row = await upsertIsometricSetLog(db, input, block.id);
      void context;
      return row ? mapIsometricSetLog(row) : null;
    });
  }

  async logSport(context: AuthContext, input: LogSportInput): Promise<null | SessionSportLog> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      assertSessionMutable(session.status, session.skippedAt);
      const block = await db.sessionSportBlock.findFirst({
        where: { archivedAt: null, id: input.sessionSportBlockId, sessionId: input.sessionId },
        select: { id: true },
      });
      if (!block) throw new NotFoundException('Sport block not found');
      const row = await upsertSportLog(db, input, block.id);
      void context;
      return row ? mapSportLog(row) : null;
    });
  }

  async logSportSet(context: AuthContext, input: LogSportSetInput): Promise<null | SessionSportSetLog> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      assertSessionMutable(session.status, session.skippedAt);
      const block = await db.sessionSportBlock.findFirst({
        where: { archivedAt: null, id: input.sessionSportBlockId, sessionId: input.sessionId },
        select: { id: true },
      });
      if (!block) throw new NotFoundException('Sport block not found');
      const row = await upsertSportSetLog(db, input, block.id);
      void context;
      return row ? mapSportSetLog(row) : null;
    });
  }

  async logSet(context: AuthContext, input: LogSetInput): Promise<null | SessionSetLog> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      assertSessionMutable(session.status, session.skippedAt);
      const item = await this.readSessionItem(input.sessionId, input.sessionItemId, db);
      if (!item) {
        throw new NotFoundException('Session item not found');
      }
      const row = await upsertSetLog(db, input, item.id);
      void context;
      return row ? mapSetLog(row) : null;
    });
  }

  startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance> {
    return this.cardioRepository.startCardioSession(context, sessionId);
  }

  async startSession(context: AuthContext, input: StartSessionInput): Promise<SessionInstance> {
    await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      if (session.startedAt || session.status === SessionStatus.COMPLETED) {
        return mapSessionWithGroups(db, session);
      }
      const claimed = await db.sessionInstance.updateMany({
        where: { id: session.id, archivedAt: null, status: SessionStatus.PENDING, startedAt: null },
        data: {
          ...buildUpdateAuditFields(context),
          preFatigue: input.preFatigue ?? null,
          preMotivation: input.preMotivation ?? null,
          preRecovery: input.preRecovery ?? null,
          skipReason: null,
          skippedAt: null,
          startMode: input.startMode ?? null,
          startedAt: new Date(),
          status: SessionStatus.IN_PROGRESS,
        },
      });
      const current =
        claimed.count > 0
          ? await db.sessionInstance.findFirst({ where: { id: session.id }, include: sessionInclude() })
          : await this.readSessionForMutation(input.sessionId, db);
      if (!current) throw new NotFoundException('Session not found');
      return mapSessionWithGroups(db, current);
    });
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
      where: {
        archivedAt: null,
        id: sessionId,
        client: { archivedAt: null, email: context.email ?? '' },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  private async readSessionForMutation(sessionId: string, db: Prisma.TransactionClient) {
    const row = await db.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: sessionInclude(),
    });
    if (!row) {
      throw new NotFoundException('Session not found');
    }
    return row;
  }

  private async readTemplateSnapshot(
    db: Prisma.TransactionClient,
    templateId: string,
    coachMembershipId: string,
    planDayId?: string | null,
  ) {
    const row = await readWorkoutTemplate(db, templateId, coachMembershipId);
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
    const day = row.days.find((d) => d.id === resolvedPlanDayId);
    if (!day) {
      throw new NotFoundException('Plan day not found for this template');
    }
    const exercises = day.exercises.map(mapTemplateExerciseSnapshot);
    const plioBlocks = day.plioBlocks.map(mapTemplatePlioSnapshot);
    const mobilityBlocks = day.mobilityBlocks.map(mapTemplateMobilitySnapshot);
    const isometricBlocks = day.isometricBlocks.map(mapTemplateIsometricSnapshot);
    const sportBlocks = day.sportBlocks.map(mapTemplateSportSnapshot);
    const hasContent =
      exercises.length > 0 ||
      plioBlocks.length > 0 ||
      mobilityBlocks.length > 0 ||
      isometricBlocks.length > 0 ||
      sportBlocks.length > 0;
    if (!hasContent) {
      throw new BadRequestException('Selected template day has no workout content');
    }
    return {
      id: row.id,
      items: exercises,
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

  private readSessionItem(sessionId: string, sessionItemId: string, db: Prisma.TransactionClient) {
    return db.sessionStrengthItem.findFirst({
      where: { archivedAt: null, id: sessionItemId, sessionId },
      select: { id: true },
    });
  }
}
