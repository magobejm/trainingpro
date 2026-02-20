import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, SessionStatus, TemplateKind } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CardioIntervalLog,
  CardioSessionInstance,
} from '../../domain/cardio-session.entity';
import type { EnsureCardioSessionInput, LogIntervalInput } from '../../domain/cardio-session.input';
import type { FinishSessionInput } from '../../domain/session.input';
import {
  assertCardioSessionMutable,
  cardioSessionInclude,
  mapCardioIntervalLog,
  mapCardioSession,
  mapCardioSessionBlockCreate,
  readFirstDayCardioBlocks,
} from './sessions-cardio.prisma.helpers';

type CoachMembership = {
  id: string;
  organizationId: string;
};

type ExistingCardioSession = NonNullable<
  Awaited<ReturnType<SessionsCardioRepositoryPrisma['readExistingSession']>>
>;

@Injectable()
export class SessionsCardioRepositoryPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async ensureCardioSession(
    context: AuthContext,
    input: EnsureCardioSessionInput,
  ): Promise<CardioSessionInstance> {
    const membership = await this.resolveCoachMembership(context);
    const existing = await this.readExistingSession(input);
    if (existing) {
      return this.assertAndMapExisting(existing);
    }
    return this.createCardioSession(context, input, membership);
  }

  async finishCardioSession(
    context: AuthContext,
    input: FinishSessionInput,
  ): Promise<CardioSessionInstance> {
    const session = await this.readCardioSessionForMutation(input.sessionId);
    assertCardioSessionMutable(session.status);
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
      include: cardioSessionInclude(),
    });
    return mapCardioSession(updated);
  }

  async getCardioSessionById(
    context: AuthContext,
    sessionId: string,
  ): Promise<CardioSessionInstance | null> {
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

  async logInterval(context: AuthContext, input: LogIntervalInput): Promise<CardioIntervalLog> {
    const session = await this.readCardioSessionForMutation(input.sessionId);
    assertCardioSessionMutable(session.status);
    const block = await this.readSessionCardioBlock(input.sessionId, input.sessionCardioBlockId);
    if (!block) {
      throw new NotFoundException('Session cardio block not found');
    }
    const row = await this.upsertIntervalLog(input, block.id);
    void context;
    return mapCardioIntervalLog(row);
  }

  async startCardioSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<CardioSessionInstance> {
    const session = await this.readCardioSessionForMutation(sessionId);
    if (session.startedAt || session.status === SessionStatus.COMPLETED) {
      return mapCardioSession(session);
    }
    const updated = await this.prisma.sessionInstance.update({
      where: { id: session.id },
      data: {
        ...buildUpdateAuditFields(context),
        startedAt: new Date(),
        status: SessionStatus.IN_PROGRESS,
      },
      include: cardioSessionInclude(),
    });
    return mapCardioSession(updated);
  }

  private readExistingSession(input: EnsureCardioSessionInput) {
    return this.prisma.sessionInstance.findFirst({
      where: {
        archivedAt: null,
        clientId: input.clientId,
        sessionDate: input.sessionDate,
      },
      include: cardioSessionInclude(),
    });
  }

  private assertAndMapExisting(existing: ExistingCardioSession) {
    if (existing.template.kind !== TemplateKind.CARDIO) {
      throw new BadRequestException('Session date already used by strength template');
    }
    return mapCardioSession(existing);
  }

  private async createCardioSession(
    context: AuthContext,
    input: EnsureCardioSessionInput,
    membership: CoachMembership,
  ) {
    const template = await this.readCardioTemplateSnapshot(input.templateId, membership.id);
    const row = await this.prisma.sessionInstance.create({
      data: {
        ...buildCreateAuditFields(context),
        clientId: input.clientId,
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        sessionDate: input.sessionDate,
        sourceTemplateId: template.id,
        sourceTemplateVersion: template.templateVersion,
        status: SessionStatus.PENDING,
        cardioBlocks: { create: template.blocks.map(mapCardioSessionBlockCreate) },
      },
      include: cardioSessionInclude(),
    });
    return mapCardioSession(row);
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
    const blocks = readFirstDayCardioBlocks(row.days);
    if (!blocks) {
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
            },
          },
        },
      },
    });
  }

  private upsertIntervalLog(input: LogIntervalInput, sessionCardioBlockId: string) {
    return this.prisma.intervalLog.upsert({
      where: {
        sessionCardioBlockId_intervalIndex: {
          intervalIndex: input.intervalIndex,
          sessionCardioBlockId,
        },
      },
      create: {
        avgHeartRate: input.avgHeartRate ?? null,
        distanceDoneMeters: input.distanceDoneMeters ?? null,
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRpe: input.effortRpe ?? null,
        intervalIndex: input.intervalIndex,
        sessionCardioBlockId,
        sessionId: input.sessionId,
      },
      update: {
        avgHeartRate: input.avgHeartRate ?? null,
        distanceDoneMeters: input.distanceDoneMeters ?? null,
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRpe: input.effortRpe ?? null,
      },
    });
  }
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
