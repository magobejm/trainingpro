import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SessionStatus } from '@prisma/client';
import { buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { exerciseHistoryQuery, mapExerciseHistory } from './exercise-history';
import { readSessionOrigins } from '../../../../common/plan/session-origins.prisma';
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
  FinishExerciseInput,
  FinishSessionInput,
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
  LogSportSetInput,
  StartSessionInput,
} from '../../domain/session.input';
import type { SessionWriteOptions, SessionsRepositoryPort } from '../../domain/sessions-repository.port';
import { discardOpenSession } from './session-discard';
import { finishIfOpen } from './session-concurrency';
import { assertWritableSession, takeStaleFinish } from './session-finish-replace';
import { closeStaleSessions } from './session-stale';
import { writeExerciseOrder } from './finish-exercise.prisma';
import { withLockedSession } from './session-lock';
import { readWritableSession } from './session-write-scope';
import { persistEnsuredSession } from './session-ensure';
import {
  mapIsometricSetLog,
  mapMobilitySetLog,
  mapPlioSetLog,
  mapSetLog,
  mapSportLog,
  mapSportSetLog,
  mapTemplateIsometricSnapshot,
  mapTemplateMobilitySnapshot,
  mapTemplatePlioSnapshot,
  mapTemplateSportSnapshot,
} from './sessions-prisma.mappers';
import { mapProgressedExercises, readAssignmentStart } from './session-progression';
import { SessionsCardioRepositoryPrisma } from './sessions-cardio.repository.prisma';
import { mapCardioTemplateBlockSnapshot } from './sessions-cardio.prisma.helpers';
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

  async discardSession(context: AuthContext, sessionId: string): Promise<SessionInstance> {
    return withLockedSession(this.prisma, sessionId, async (db) => {
      const session = await this.readSessionForMutation(sessionId, db);
      await discardOpenSession(db, context, session);
      return mapSessionWithGroups(db, await this.readSessionForMutation(sessionId, db));
    });
  }

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
    const row = await persistEnsuredSession(this.prisma, context, input, membership, async (tx) => {
      let planDayId = input.planDayId;
      if (!planDayId) {
        const client = await tx.client.findUnique({
          where: { id: input.clientId },
          include: { activeRoutineAssignment: { include: { revision: true } } },
        });
        const revision = client?.activeRoutineAssignment?.revision;
        if (revision?.templateId === input.templateId)
          planDayId = (
            await tx.planDay.findFirst({
              where: { templateId: input.templateId, revisionVersion: revision.version, archivedAt: null },
              orderBy: { dayIndex: 'asc' },
            })
          )?.id;
      }
      return this.readTemplateSnapshot(tx, input.templateId, membership.id, planDayId, input.clientId);
    });
    return mapSessionWithGroups(this.prisma, row);
  }

  logCardioDistance(
    context: AuthContext,
    input: { sessionId: string; blockId: string; distanceDoneMeters: number | null },
    options?: SessionWriteOptions,
  ) {
    return this.cardioRepository.logCardioDistance(context, input, options);
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
    await closeStaleSessions(this.prisma, { clientId });
    const rows = await this.prisma.sessionInstance.findMany(
      exerciseHistoryQuery(clientId, sourceExerciseId, limit, excludeSessionId),
    );
    const origins = await readSessionOrigins(this.prisma, rows);
    return rows.map((row) => ({ ...mapExerciseHistory(row), originDate: origins.get(row.id) ?? null }));
  }

  async finishSession(context: AuthContext, input: FinishSessionInput): Promise<SessionInstance> {
    if (!input.finishedAt) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readSessionForMutation(input.sessionId, db);
      if (session.skippedAt) throw new BadRequestException('Session marked as skipped');
      const replaced = await takeStaleFinish(
        session,
        input,
        () => replaceStaleStrengthFinish(db, context, session.id, input),
        () => this.readSessionForMutation(input.sessionId, db),
      );
      if (replaced) return mapSessionWithGroups(db, replaced);
      const row = await finishIfOpen(
        session,
        input,
        async () => {
          const updated = await db.sessionInstance.updateMany({
            where: { id: session.id, status: { not: SessionStatus.COMPLETED } },
            data: strengthFinishData(context, input),
          });
          return updated.count;
        },
        () => this.readSessionForMutation(input.sessionId, db),
      );
      return mapSessionWithGroups(db, row);
    });
  }

  getCardioSessionById(
    context: AuthContext,
    sessionId: string,
    options?: SessionWriteOptions,
  ): Promise<CardioSessionInstance | null> {
    return this.cardioRepository.getCardioSessionById(context, sessionId, options);
  }

  async getSessionById(
    context: AuthContext,
    sessionId: string,
    options?: SessionWriteOptions,
  ): Promise<SessionInstance | null> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId });
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: sessionInclude(),
    });
    void context;
    return row ? mapSessionWithGroups(this.prisma, row) : null;
  }

  logInterval(
    context: AuthContext,
    input: LogIntervalInput,
    options?: SessionWriteOptions,
  ): Promise<CardioIntervalLog | null> {
    return this.cardioRepository.logInterval(context, input, options);
  }

  async logPlioSet(
    context: AuthContext,
    input: LogPlioSetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionPlioSetLog> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await readWritableSession(db, input.sessionId);
      assertWritableSession(session, options);
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

  async logMobilitySet(
    context: AuthContext,
    input: LogMobilitySetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionMobilitySetLog> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await readWritableSession(db, input.sessionId);
      assertWritableSession(session, options);
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

  async logIsometricSet(
    context: AuthContext,
    input: LogIsometricSetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionIsometricSetLog> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await readWritableSession(db, input.sessionId);
      assertWritableSession(session, options);
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

  async logSport(
    context: AuthContext,
    input: LogSportInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionSportLog> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await readWritableSession(db, input.sessionId);
      assertWritableSession(session, options);
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

  async logSportSet(
    context: AuthContext,
    input: LogSportSetInput,
    options?: SessionWriteOptions,
  ): Promise<null | SessionSportSetLog> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await readWritableSession(db, input.sessionId);
      assertWritableSession(session, options);
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

  async finishExercise(
    context: AuthContext,
    input: FinishExerciseInput,
    options?: SessionWriteOptions,
  ): Promise<SessionInstance> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      await writeExerciseOrder(db, context, input.sessionId, input.itemId, options);
      return mapSessionWithGroups(db, await this.readSessionForMutation(input.sessionId, db));
    });
  }

  async logSet(context: AuthContext, input: LogSetInput, options?: SessionWriteOptions): Promise<null | SessionSetLog> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await readWritableSession(db, input.sessionId);
      assertWritableSession(session, options);
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
    clientId?: string,
  ) {
    const row = await readWorkoutTemplate(db, templateId, coachMembershipId, planDayId, clientId);
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
    const cardioBlocks = (day.cardioBlocks ?? []).map(mapCardioTemplateBlockSnapshot);
    const exercises = await mapProgressedExercises(db, day.exercises, {
      appliedAt: await readAssignmentStart(db, clientId, templateId),
      clientId,
      mesocycleMicrocycles: row.mesocycleMicrocycles,
      microcycleDays: row.expectedCompletionDays,
    });
    const plioBlocks = day.plioBlocks.map(mapTemplatePlioSnapshot);
    const mobilityBlocks = day.mobilityBlocks.map(mapTemplateMobilitySnapshot);
    const isometricBlocks = day.isometricBlocks.map(mapTemplateIsometricSnapshot);
    const sportBlocks = day.sportBlocks.map(mapTemplateSportSnapshot);
    const hasContent =
      exercises.length > 0 ||
      plioBlocks.length > 0 ||
      mobilityBlocks.length > 0 ||
      isometricBlocks.length > 0 ||
      sportBlocks.length > 0 ||
      cardioBlocks.length > 0;
    if (!hasContent) {
      throw new BadRequestException('Selected template day has no workout content');
    }
    return {
      id: row.id,
      cardioBlocks,
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

function strengthFinishData(context: AuthContext, input: FinishSessionInput) {
  return {
    ...buildUpdateAuditFields(context),
    finishComment: normalizeText(input.comment),
    finishedAt: input.finishedAt ?? new Date(),
    isCompleted: true,
    isIncomplete: input.isIncomplete,
    performedDurationSeconds: input.performedDurationSeconds ?? null,
    postFatigue: input.postFatigue ?? null,
    postMood: input.postMood ?? null,
    postPain: input.postPain ?? null,
    sessionRpe: input.sessionRpe ?? null,
    status: SessionStatus.COMPLETED,
  };
}

function replaceStaleStrengthFinish(
  db: Prisma.TransactionClient,
  context: AuthContext,
  sessionId: string,
  input: FinishSessionInput,
): Promise<number> {
  return db.sessionInstance
    .updateMany({
      data: strengthFinishData(context, input),
      where: {
        finishComment: null,
        id: sessionId,
        isIncomplete: true,
        performedDurationSeconds: null,
        sessionRpe: null,
        status: SessionStatus.COMPLETED,
      },
    })
    .then((updated) => updated.count);
}
