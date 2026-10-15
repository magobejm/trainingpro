import { Injectable, NotFoundException } from '@nestjs/common';
import { sessionOutcome, type SessionOutcome } from '@trainerpro/shared';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { closeStaleSessions } from '../../../sessions/infra/prisma/session-stale';

export type ClientSessionSummary = {
  id: string;
  sessionDate: Date;
  status: string;
  isCompleted: boolean;
  isIncomplete: boolean;
  planDayId: string | null;
  planDayIndex: number | null;
  planDayTitle: string | null;
  preMotivation: number | null;
  postMood: number | null;
  outcome: SessionOutcome;
  postFatigue: number | null;
  postPain: number | null;
  skipReason: string | null;
  skippedAt: Date | null;
};

type ListClientSessionsInput = {
  dateFrom: Date;
  dateTo: Date;
};

@Injectable()
export class ListClientSessionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: ListClientSessionsInput): Promise<ClientSessionSummary[]> {
    const client = await this.resolveClient(context);
    await closeStaleSessions(this.prisma, { clientId: client.id });
    const rows = await this.prisma.sessionInstance.findMany({
      where: {
        clientId: client.id,
        archivedAt: null,
        sessionDate: { gte: input.dateFrom, lte: input.dateTo },
      },
      select: {
        id: true,
        sessionDate: true,
        status: true,
        isCompleted: true,
        isIncomplete: true,
        planDayId: true,
        planDayIndex: true,
        planDayTitle: true,
        preMotivation: true,
        postMood: true,
        postFatigue: true,
        postPain: true,
        skipReason: true,
        skippedAt: true,
      },
      orderBy: [{ sessionDate: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      sessionDate: r.sessionDate,
      status: r.status,
      isCompleted: r.isCompleted,
      isIncomplete: r.isIncomplete,
      planDayId: r.planDayId,
      planDayIndex: r.planDayIndex,
      planDayTitle: r.planDayTitle,
      preMotivation: r.preMotivation,
      postMood: r.postMood,
      outcome: sessionOutcome(r),
      postFatigue: r.postFatigue,
      postPain: r.postPain,
      skipReason: r.skipReason,
      skippedAt: r.skippedAt,
    }));
  }

  private async resolveClient(context: AuthContext) {
    const email = context.email;
    if (!email) throw new NotFoundException('Client profile not found');
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }
}
