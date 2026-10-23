import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SessionStatus, TemplateKind } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { cardioIntervalHasData } from '../../../../common/performed-set';
import { createOrReread, writeOrUpdate } from '../../../../common/prisma/unique-violation';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { CardioIntervalLog, CardioSessionInstance } from '../../domain/cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from '../../domain/cardio-session.input';
import type { SessionWriteOptions } from '../../domain/sessions-repository.port';
import type { FinishSessionInput } from '../../domain/session.input';
import { finishIfOpen } from './session-concurrency';
import { assertWritableSession, takeStaleFinish } from './session-finish-replace';
import { closeStaleSessions } from './session-stale';
import { withLockedSession } from './session-lock';
import { attachRevisionInstructions } from '../../../plans/infra/prisma/routine-revision.prisma';
import {
  cardioSessionInclude,
  mapCardioIntervalLog,
  mapCardioSession,
  mapCardioSessionBlockCreate,
  mapCardioTemplateBlockSnapshot,
} from './sessions-cardio.prisma.helpers';

type CoachMembership = {
  id: string;
  organizationId: string;
};

type ExistingCardioSession = Awaited<ReturnType<SessionsCardioRepositoryPrisma['readCardioSessionForMutation']>>;

@Injectable()
export class SessionsCardioRepositoryPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async ensureCardioSession(context: AuthContext, input: EnsureCardioSessionInput): Promise<CardioSessionInstance> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.$transaction((tx) => this.writeCardioSession(tx, context, input, membership));
    if (!row) throw new NotFoundException('Cardio session not found');
    return this.assertAndMapExisting(row);
  }

  async finishCardioSession(context: AuthContext, input: FinishSessionInput): Promise<CardioSessionInstance> {
    if (!input.finishedAt) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readCardioSessionForMutation(input.sessionId, db);
      if (session.skippedAt) throw new BadRequestException('Session marked as skipped');
      const replaced = await takeStaleFinish(
        session,
        input,
        () => replaceStaleCardioFinish(db, context, session.id, input),
        () => this.readCardioSessionForMutation(input.sessionId, db),
      );
      if (replaced) return mapCardioSession(replaced);
      const row = await finishIfOpen(
        session,
        input,
        async () => {
          const updated = await db.sessionInstance.updateMany({
            where: { id: session.id, status: { not: SessionStatus.COMPLETED } },
            data: cardioFinishData(context, input),
          });
          return updated.count;
        },
        () => this.readCardioSessionForMutation(input.sessionId, db),
      );
      return mapCardioSession(row);
    });
  }

  async getCardioSessionById(
    context: AuthContext,
    sessionId: string,
    options?: SessionWriteOptions,
  ): Promise<CardioSessionInstance | null> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId });
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: cardioSessionInclude(),
    });
    void context;
    if (!row || row.template.kind !== TemplateKind.CARDIO) {
      return null;
    }
    return mapCardioSession(row);
  }

  async logCardioDistance(
    context: AuthContext,
    input: { sessionId: string; blockId: string; distanceDoneMeters: number | null },
    options?: SessionWriteOptions,
  ) {
    if (
      input.distanceDoneMeters !== null &&
      (!Number.isFinite(input.distanceDoneMeters) || input.distanceDoneMeters < 0 || input.distanceDoneMeters > 500000)
    )
      throw new BadRequestException('Invalid distance');
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readCardioSessionForMutation(input.sessionId, db, true);
      assertWritableSession(session, options);
      const block = await this.readSessionCardioBlock(input.sessionId, input.blockId, db);
      if (!block) throw new NotFoundException('Session cardio block not found');
      void context;
      return db.sessionCardioBlock.update({
        where: { id: block.id },
        data: { distanceDoneMeters: input.distanceDoneMeters },
        select: { id: true, distanceDoneMeters: true },
      });
    });
  }

  async logInterval(
    context: AuthContext,
    input: LogIntervalInput,
    options?: SessionWriteOptions,
  ): Promise<CardioIntervalLog | null> {
    if (options?.closeStale !== false) await closeStaleSessions(this.prisma, { sessionId: input.sessionId });
    return withLockedSession(this.prisma, input.sessionId, async (db) => {
      const session = await this.readCardioSessionForMutation(input.sessionId, db, true);
      assertWritableSession(session, options);
      const block = await this.readSessionCardioBlock(input.sessionId, input.sessionCardioBlockId, db);
      if (!block) {
        throw new NotFoundException('Session cardio block not found');
      }
      const row = await this.upsertIntervalLog(input, block.id, db);
      void context;
      return row ? mapCardioIntervalLog(row) : null;
    });
  }

  async startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance> {
    await closeStaleSessions(this.prisma, { sessionId: sessionId });
    return withLockedSession(this.prisma, sessionId, async (db) => {
      const session = await this.readCardioSessionForMutation(sessionId, db);
      if (session.startedAt || session.status === SessionStatus.COMPLETED) {
        return mapCardioSession(session);
      }
      const claimed = await db.sessionInstance.updateMany({
        where: { id: session.id, archivedAt: null, status: SessionStatus.PENDING, startedAt: null },
        data: {
          ...buildUpdateAuditFields(context),
          skipReason: null,
          skippedAt: null,
          startedAt: new Date(),
          status: SessionStatus.IN_PROGRESS,
        },
      });
      const current =
        claimed.count > 0
          ? await db.sessionInstance.findFirst({ where: { id: session.id }, include: cardioSessionInclude() })
          : await this.readCardioSessionForMutation(sessionId, db);
      if (!current || current.template.kind !== TemplateKind.CARDIO) {
        throw new NotFoundException('Cardio session not found');
      }
      return mapCardioSession(current);
    });
  }

  private async writeCardioSession(
    tx: Prisma.TransactionClient,
    context: AuthContext,
    input: EnsureCardioSessionInput,
    membership: CoachMembership,
  ) {
    const existing = await tx.sessionInstance.findFirst({
      where: { archivedAt: null, clientId: input.clientId, sessionDate: input.sessionDate },
      include: cardioSessionInclude(),
    });
    if (existing) return existing;
    const client = await tx.client.findUnique({
      where: { id: input.clientId },
      include: { activeRoutineAssignment: { include: { revision: true } } },
    });
    const revision = client?.activeRoutineAssignment?.revision;
    const template = await this.readCardioTemplateSnapshot(
      tx,
      input.templateId,
      membership.id,
      revision?.templateId === input.templateId ? revision.version : undefined,
    );
    return createOrReread(
      () =>
        tx.sessionInstance.create({
          data: {
            ...buildCreateAuditFields(context),
            cardioBlocks: { create: template.blocks.map(mapCardioSessionBlockCreate) },
            clientId: input.clientId,
            coachMembershipId: membership.id,
            organizationId: membership.organizationId,
            sessionDate: input.sessionDate,
            sourceTemplateId: template.id,
            sourceTemplateVersion: template.templateVersion,
            status: SessionStatus.PENDING,
          },
          include: cardioSessionInclude(),
        }),
      () =>
        tx.sessionInstance.findFirst({
          where: { clientId: input.clientId, sessionDate: input.sessionDate },
          include: cardioSessionInclude(),
        }),
    );
  }

  private assertAndMapExisting(existing: ExistingCardioSession) {
    if (existing.template.kind !== TemplateKind.CARDIO) {
      throw new BadRequestException('Session date already used by strength template');
    }
    return mapCardioSession(existing);
  }

  private async readCardioSessionForMutation(sessionId: string, db: Prisma.TransactionClient, allowWorkoutCardio = false) {
    const row = await db.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: cardioSessionInclude(),
    });
    const workoutCardio =
      allowWorkoutCardio &&
      row &&
      row.cardioBlocks.length > 0 &&
      (row.template.kind === TemplateKind.ROUTINE || row.template.kind === TemplateKind.STRENGTH);
    if (!row || (row.template.kind !== TemplateKind.CARDIO && !workoutCardio)) {
      throw new NotFoundException('Cardio session not found');
    }
    return row;
  }

  private async readCardioTemplateSnapshot(
    tx: Prisma.TransactionClient,
    templateId: string,
    coachMembershipId: string,
    version?: number,
  ) {
    const row = await this.readCardioTemplate(tx, templateId, coachMembershipId);
    if (!row) {
      throw new NotFoundException('Cardio template not found');
    }
    await attachRevisionInstructions(tx, templateId, version ?? row.templateVersion, row.days);
    const firstDay = row.days.find((day) => day.revisionVersion === (version ?? row.templateVersion));
    if (!firstDay) {
      throw new BadRequestException('Template has no days');
    }
    const blocks = firstDay.cardioBlocks.map(mapCardioTemplateBlockSnapshot);
    if (blocks.length === 0) {
      throw new BadRequestException('Template has no cardio blocks');
    }
    return {
      blocks,
      id: row.id,
      templateVersion: version ?? row.templateVersion,
    };
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
      throw new NotFoundException('Coach membership not found');
    }
    return membership;
  }

  private readSessionCardioBlock(sessionId: string, sessionCardioBlockId: string, db: Prisma.TransactionClient) {
    return db.sessionCardioBlock.findFirst({
      where: { archivedAt: null, id: sessionCardioBlockId, sessionId },
      select: { id: true },
    });
  }

  private readCardioTemplate(tx: Prisma.TransactionClient, templateId: string, coachMembershipId: string) {
    return tx.planTemplate.findFirst({
      where: {
        archivedAt: null,
        coachMembershipId,
        id: templateId,
        kind: TemplateKind.CARDIO,
      },
      include: {
        days: {
          where: { archivedAt: null },
          orderBy: { dayIndex: 'asc' },
          include: {
            cardioBlocks: {
              where: { archivedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: {
                libraryCardioMethod: { select: { coachInstructions: true } },
                sets: { orderBy: { setIndex: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  private async upsertIntervalLog(input: LogIntervalInput, sessionCardioBlockId: string, db: Prisma.TransactionClient) {
    if (!cardioIntervalHasData(input)) {
      await db.intervalLog.deleteMany({
        where: { intervalIndex: input.intervalIndex, sessionCardioBlockId },
      });
      return null;
    }
    const where = {
      sessionCardioBlockId_intervalIndex: {
        intervalIndex: input.intervalIndex,
        sessionCardioBlockId,
      },
    };
    const update = {
      avgHeartRate: input.avgHeartRate ?? null,
      hrMaxPctDone: input.hrMaxPctDone ?? null,
      hrReservePctDone: input.hrReservePctDone ?? null,
      ...(input.distanceDoneMeters === undefined ? {} : { distanceDoneMeters: input.distanceDoneMeters }),
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRpe: input.effortRpe ?? null,
      ...(input.restSecondsDone === undefined ? {} : { restSecondsDone: input.restSecondsDone }),
    };
    return writeOrUpdate(
      () =>
        db.intervalLog.upsert({
          where,
          create: {
            ...update,
            distanceDoneMeters: input.distanceDoneMeters ?? null,
            intervalIndex: input.intervalIndex,
            restSecondsDone: input.restSecondsDone ?? null,
            sessionCardioBlockId,
            sessionId: input.sessionId,
          },
          update,
        }),
      () => db.intervalLog.update({ where, data: update }),
    );
  }
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function cardioFinishData(context: AuthContext, input: FinishSessionInput) {
  return {
    ...buildUpdateAuditFields(context),
    finishComment: normalizeText(input.comment),
    finishedAt: input.finishedAt ?? new Date(),
    isCompleted: true,
    isIncomplete: input.isIncomplete,
    performedDurationSeconds: input.performedDurationSeconds ?? null,
    sessionRpe: input.sessionRpe ?? null,
    status: SessionStatus.COMPLETED,
  };
}

function replaceStaleCardioFinish(
  db: Prisma.TransactionClient,
  context: AuthContext,
  sessionId: string,
  input: FinishSessionInput,
): Promise<number> {
  return db.sessionInstance
    .updateMany({
      data: cardioFinishData(context, input),
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
