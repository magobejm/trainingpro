import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { withLockedSession } from '../../../sessions/infra/prisma/session-lock';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../../sessions/domain/sessions-repository.port';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

export type SkipClientSessionInput = {
  offsetMinutes: number;
  planDayId: string;
  reason?: string;
  sessionDate: Date;
};

@Injectable()
export class SkipClientSessionUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly clientsRepository: ClientsRepositoryPort,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, input: SkipClientSessionInput, now = new Date()): Promise<{ id: string }> {
    assertSkippableDate(input.sessionDate, now, input.offsetMinutes);
    const client = await this.readClient(context);
    const templateId = await this.readTemplateId(context, client, input.planDayId);
    const session = await this.sessionsRepository.ensureSessionForClient(context, {
      clientId: client.id,
      coachMembershipId: client.coachMembershipId,
      organizationId: client.organizationId,
      planDayId: input.planDayId,
      sessionDate: input.sessionDate,
      templateId,
    });
    if (session.status !== 'PENDING' || session.startedAt) {
      throw new ConflictException('Session already started');
    }
    const updated = await withLockedSession(this.prisma, session.id, (tx) =>
      tx.sessionInstance.updateMany({
        data: { skipReason: cleanReason(input.reason), skippedAt: now },
        where: {
          id: session.id,
          clientId: client.id,
          archivedAt: null,
          status: 'PENDING',
          startedAt: null,
          logs: { none: {} },
          intervalLogs: { none: {} },
          plioLogs: { none: {} },
          mobilityLogs: { none: {} },
          isometricLogs: { none: {} },
          sportLogs: { none: {} },
          sportSetLogs: { none: {} },
        },
      }),
    );
    if (updated.count === 0) throw new ConflictException('Session already started or has recorded activity');
    return { id: session.id };
  }

  private async readClient(context: AuthContext) {
    const email = context.email;
    if (!email) throw new NotFoundException('Client profile not found');
    const client = await this.clientsRepository.findClientByEmail(email);
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }

  private async readTemplateId(
    context: AuthContext,
    client: { trainingPlanId: string | null },
    planDayId: string,
  ): Promise<string> {
    const email = context.email ?? '';
    const calendarTemplateId = await this.clientsRepository.findClientPlanDayTemplateIdByEmail(email, planDayId);
    const templateId = calendarTemplateId ?? client.trainingPlanId;
    if (!templateId) throw new ConflictException('No training plan assigned');
    return templateId;
  }
}

@Injectable()
export class UndoClientSessionSkipUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, sessionId: string): Promise<{ id: string }> {
    const client = await this.readOwnedClient(context);
    const session = await this.prisma.sessionInstance.findFirst({
      select: { id: true, startedAt: true, status: true },
      where: { archivedAt: null, clientId: client.id, id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'PENDING' || session.startedAt) {
      throw new ConflictException('Session already started');
    }
    const updated = await this.prisma.sessionInstance.updateMany({
      data: { skipReason: null, skippedAt: null },
      where: { id: session.id, clientId: client.id, archivedAt: null, status: 'PENDING', startedAt: null },
    });
    if (updated.count === 0) throw new ConflictException('Session already started');
    return { id: session.id };
  }

  private async readOwnedClient(context: AuthContext) {
    const email = context.email;
    if (!email) throw new NotFoundException('Client profile not found');
    const client = await this.prisma.client.findFirst({
      select: { id: true },
      where: { archivedAt: null, email },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }
}

export function assertSkippableDate(sessionDate: Date, now: Date, offsetMinutes: number): void {
  const local = new Date(now.getTime() - offsetMinutes * 60_000);
  const today = local.toISOString().slice(0, 10);
  const day = sessionDate.toISOString().slice(0, 10);
  if (day > today) throw new BadRequestException('Future sessions cannot be skipped');
}

function cleanReason(reason: string | undefined): string | null {
  const trimmed = reason?.trim() ?? '';
  return trimmed ? trimmed.slice(0, 280) : null;
}
