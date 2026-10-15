import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { PhysicalTestsRepository } from '../../../physical-tests/infra/prisma/physical-tests.repository';
import { closeStaleSessions } from '../../../sessions/infra/prisma/session-stale';
import {
  CALENDAR_REPOSITORY,
  type CalendarEventEntity,
  type ICalendarRepository,
  type ListCalendarEventsQuery,
} from '../../domain/calendar.repository.port';
import { pendingProposalAsEvent, withCallStatus } from '../../domain/call-status';
import { indexSessionOutcomes, readWorkoutMark, workoutEventFields } from '../../domain/completed-workout';

@Injectable()
export class ListCalendarEventsUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY)
    private readonly calendarRepository: ICalendarRepository,
    private readonly prisma: PrismaService,
    private readonly physicalTests: PhysicalTestsRepository,
  ) {}

  async execute(context: AuthContext, query: ListCalendarEventsQuery) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can list calendar events');
    }
    const membership = await this.readCoachMembership(context.subject);
    const events = await this.calendarRepository.list(membership.id, query);
    const marks = await this.loadWorkoutMarks(membership.id, query);
    const pending = await this.loadPendingProposals(membership.id, query);
    const tests = query.coachOnly ? [] : await this.loadPhysicalTests(membership.id, query);
    return {
      data: [
        ...events.map((event) => {
          const mark = readWorkoutMark(marks, event.clientId, event.date, event.planDayId);
          const workout = event.type === 'workout' ? workoutEventFields(mark) : null;
          return {
            ...withCallStatus(event),
            isCompleted: workout ? workout.isCompleted : Boolean(event.isCompleted),
            ...(workout ?? {}),
          };
        }),
        ...pending,
        ...tests,
      ],
    };
  }

  private async loadPhysicalTests(
    coachMembershipId: string,
    query: ListCalendarEventsQuery,
  ): Promise<CalendarEventEntity[]> {
    const rows = await this.physicalTests.listScheduleCalendarRows({
      clientId: query.clientId,
      coachMembershipId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return rows.map((row) => ({
      clientId: row.clientId,
      clientName: row.clientName,
      coachMembershipId: row.coachMembershipId,
      color: null,
      content: null,
      createdAt: row.createdAt,
      date: row.scheduledDate,
      id: row.id,
      isCompleted: row.done,
      originDate: null,
      planDayId: null,
      scheduleId: row.id,
      time: null,
      title: row.testName,
      type: 'physical_test',
      updatedAt: row.updatedAt,
    }));
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

  private async loadWorkoutMarks(coachMembershipId: string, query: ListCalendarEventsQuery) {
    await closeStaleSessions(this.prisma, { clientId: query.clientId, coachMembershipId });
    const rows = await this.prisma.sessionInstance.findMany({
      select: {
        clientId: true,
        id: true,
        isCompleted: true,
        isIncomplete: true,
        planDayId: true,
        sessionDate: true,
        skipReason: true,
        skippedAt: true,
        status: true,
      },
      where: {
        archivedAt: null,
        coachMembershipId,
        sessionDate: { gte: query.dateFrom, lte: query.dateTo },
        ...(query.clientId ? { clientId: query.clientId } : {}),
      },
    });
    return indexSessionOutcomes(rows).marks;
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
