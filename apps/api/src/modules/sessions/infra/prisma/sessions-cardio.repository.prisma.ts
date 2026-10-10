import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SessionStatus, TemplateKind } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { cardioIntervalHasData } from '../../../../common/performed-set';
import { createOrReread, writeOrUpdate } from '../../../../common/prisma/unique-violation';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { CardioIntervalLog, CardioSessionInstance } from '../../domain/cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from '../../domain/cardio-session.input';
import type { FinishSessionInput } from '../../domain/session.input';
import { finishIfOpen } from './session-concurrency';
import {
  assertCardioSessionMutable,
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
    const session = await this.readCardioSessionForMutation(input.sessionId);
    const row = await finishIfOpen(
      session,
      input,
      async () => {
        const updated = await this.prisma.sessionInstance.updateMany({
          where: { id: session.id, status: { not: SessionStatus.COMPLETED } },
          data: {
            ...buildUpdateAuditFields(context),
            finishComment: normalizeText(input.comment),
            finishedAt: new Date(),
            isCompleted: true,
            isIncomplete: input.isIncomplete,
            sessionRpe: input.sessionRpe ?? null,
            status: SessionStatus.COMPLETED,
          },
        });
        return updated.count;
      },
      () => this.readCardioSessionForMutation(input.sessionId),
    );
    return mapCardioSession(row);
  }

  async getCardioSessionById(context: AuthContext, sessionId: string): Promise<CardioSessionInstance | null> {
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

  async logInterval(context: AuthContext, input: LogIntervalInput): Promise<CardioIntervalLog | null> {
    const session = await this.readCardioSessionForMutation(input.sessionId);
    assertCardioSessionMutable(session.status);
    const block = await this.readSessionCardioBlock(input.sessionId, input.sessionCardioBlockId);
    if (!block) {
      throw new NotFoundException('Session cardio block not found');
    }
    const row = await this.upsertIntervalLog(input, block.id);
    void context;
    return row ? mapCardioIntervalLog(row) : null;
  }

  async startCardioSession(context: AuthContext, sessionId: string): Promise<CardioSessionInstance> {
    const session = await this.readCardioSessionForMutation(sessionId);
    if (session.startedAt || session.status === SessionStatus.COMPLETED) {
      return mapCardioSession(session);
    }
    const claimed = await this.prisma.sessionInstance.updateMany({
      where: { id: session.id, startedAt: null },
      data: {
        ...buildUpdateAuditFields(context),
        startedAt: new Date(),
        status: SessionStatus.IN_PROGRESS,
      },
    });
    const current =
      claimed.count > 0
        ? await this.prisma.sessionInstance.findFirst({ where: { id: session.id }, include: cardioSessionInclude() })
        : await this.readCardioSessionForMutation(sessionId);
    if (!current || current.template.kind !== TemplateKind.CARDIO) {
      throw new NotFoundException('Cardio session not found');
    }
    return mapCardioSession(current);
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
    const template = await this.readCardioTemplateSnapshot(input.templateId, membership.id);
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

  private async readCardioSessionForMutation(sessionId: string) {
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId },
      include: cardioSessionInclude(),
    });
    if (!row || row.template.kind !== TemplateKind.CARDIO) {
      throw new NotFoundException('Cardio session not found');
    }
    return row;
  }

  private async readCardioTemplateSnapshot(templateId: string, coachMembershipId: string) {
    const row = await this.readCardioTemplate(templateId, coachMembershipId);
    if (!row) {
      throw new NotFoundException('Cardio template not found');
    }
    const firstDay = row.days[0];
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
      templateVersion: row.templateVersion,
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

  private readSessionCardioBlock(sessionId: string, sessionCardioBlockId: string) {
    return this.prisma.sessionCardioBlock.findFirst({
      where: { archivedAt: null, id: sessionCardioBlockId, sessionId },
      select: { id: true },
    });
  }

  private readCardioTemplate(templateId: string, coachMembershipId: string) {
    return this.prisma.planTemplate.findFirst({
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

  private async upsertIntervalLog(input: LogIntervalInput, sessionCardioBlockId: string) {
    if (!cardioIntervalHasData(input)) {
      await this.prisma.intervalLog.deleteMany({
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
      distanceDoneMeters: input.distanceDoneMeters ?? null,
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRpe: input.effortRpe ?? null,
      ...(input.restSecondsDone === undefined ? {} : { restSecondsDone: input.restSecondsDone }),
    };
    return writeOrUpdate(
      () =>
        this.prisma.intervalLog.upsert({
          where,
          create: {
            ...update,
            intervalIndex: input.intervalIndex,
            restSecondsDone: input.restSecondsDone ?? null,
            sessionCardioBlockId,
            sessionId: input.sessionId,
          },
          update,
        }),
      () => this.prisma.intervalLog.update({ where, data: update }),
    );
  }
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
