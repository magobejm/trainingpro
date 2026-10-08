import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  CALENDAR_REPOSITORY,
  type ICalendarRepository,
  type ListCalendarEventsQuery,
} from '../../domain/calendar.repository.port';
import { pendingProposalAsEvent, withCallStatus } from '../../domain/call-status';

@Injectable()
export class ListCalendarEventsUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY)
    private readonly calendarRepository: ICalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, query: ListCalendarEventsQuery) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can list calendar events');
    }
    const membership = await this.readCoachMembership(context.subject);
    const events = await this.calendarRepository.list(membership.id, query);
    const completed = await this.loadCompletedDays(membership.id, query);
    const pending = await this.loadPendingProposals(membership.id, query);
    return {
      data: [
        ...events.map((event) => ({
          ...withCallStatus(event),
          isCompleted: event.type === 'workout' && completed.has(this.dayKey(event.clientId, event.date)),
        })),
        ...pending,
      ],
    };
  }

  private async loadPendingProposals(coachMembershipId: string, query: ListCalendarEventsQuery) {
    const rows = await this.prisma.callProposal.findMany({
      where: {
        coachMembershipId,
        date: { gte: query.dateFrom, lte: query.dateTo },
        status: 'pending',
        ...(query.clientId ? { clientId: query.clientId } : {}),
      },
      select: {
        client: { select: { firstName: true, lastName: true } },
        clientId: true,
        coachMembershipId: true,
        date: true,
        id: true,
        proposedTime: true,
      },
      orderBy: { date: 'asc' },
    });
    return rows.map((row) =>
      pendingProposalAsEvent({
        clientId: row.clientId,
        clientName: `${row.client.firstName} ${row.client.lastName}`,
        coachMembershipId: row.coachMembershipId,
        date: row.date,
        id: row.id,
        proposedTime: row.proposedTime,
      }),
    );
  }

  private async loadCompletedDays(coachMembershipId: string, query: ListCalendarEventsQuery): Promise<Set<string>> {
    const rows = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        coachMembershipId,
        isCompleted: true,
        sessionDate: { gte: query.dateFrom, lte: query.dateTo },
        ...(query.clientId ? { clientId: query.clientId } : {}),
      },
      select: { clientId: true, sessionDate: true },
    });
    return new Set(rows.map((row) => this.dayKey(row.clientId, row.sessionDate)));
  }

  private dayKey(clientId: string | null, date: Date): string {
    return `${clientId ?? ''}|${date.toISOString().slice(0, 10)}`;
  }

  private async readCoachMembership(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    return membership;
  }
}
