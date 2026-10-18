import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { resolvePlanDayIdFromCalendarEvent, type PlanDayRef } from '../../../../common/plan/resolve-plan-day-from-calendar';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { isWorkoutCompleted, rememberCompletedSession } from '../../../calendar/domain/completed-workout';
import { CHAT_REPOSITORY, type ChatRepositoryPort } from '../../../chat/domain/chat.repository.port';
import {
  chooseWorkoutPlacement,
  coachMoveMessage,
  originDateAfterMove,
  pendingSearchRange,
  utcCalendarDate,
  utcDateKey,
  type WorkoutPlacement,
} from './client-calendar-plan-day-move';

export type ClientCalendarPlanDaySwapInput = {
  clientId: string;
  coachMembershipId: string;
  requestedPlanDayId: string;
  sessionDate: Date;
};

type CalendarWorkoutEvent = {
  date: Date;
  id: string;
  originDate: Date | null;
  planDayId: string | null;
  title: string | null;
};

type PlacementContext = {
  placement: WorkoutPlacement;
  requestedTitle: string | null;
  source: CalendarWorkoutEvent | null;
};

@Injectable()
export class ClientCalendarPlanDaySwapService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
  ) {}

  async needsSwap(input: ClientCalendarPlanDaySwapInput): Promise<boolean> {
    const placed = await this.place(input);
    return placed.placement.type !== 'none';
  }

  async execute(context: AuthContext, input: ClientCalendarPlanDaySwapInput): Promise<void> {
    const placed = await this.place(input);
    if (placed.placement.type === 'none') return;
    await this.persistPlacement(input, placed);
    await this.notifyCoach(context, placed);
  }

  resolveEventPlanDayId(event: CalendarWorkoutEvent, planDays: PlanDayRef[]): string | null {
    return resolvePlanDayIdFromCalendarEvent(event, planDays);
  }

  private async place(input: ClientCalendarPlanDaySwapInput): Promise<PlacementContext> {
    const planDays = await this.loadPlanDays(input.requestedPlanDayId);
    const range = pendingSearchRange(input.sessionDate);
    const events = await this.loadCandidateWorkouts(input, range);
    const completed = await this.loadCompletedKeys(input, range);
    const requestedPlanDay = planDays.find((day) => day.id === input.requestedPlanDayId) ?? null;
    const isPendingRequested = (event: CalendarWorkoutEvent): boolean => {
      const planDayId = this.resolveEventPlanDayId(event, planDays);
      if (planDayId !== input.requestedPlanDayId) return false;
      return !isWorkoutCompleted(completed, input.clientId, event.date, planDayId);
    };
    const placement = chooseWorkoutPlacement({
      events,
      isPendingRequested,
      todayKey: utcDateKey(input.sessionDate),
    });
    const source = placement.type === 'move' ? (events.find((event) => event.id === placement.sourceId) ?? null) : null;
    return { placement, requestedTitle: requestedPlanDay?.title ?? source?.title ?? null, source };
  }

  private async persistPlacement(input: ClientCalendarPlanDaySwapInput, placed: PlacementContext): Promise<void> {
    const performedDate = utcCalendarDate(input.sessionDate);
    await this.prisma.$transaction(async (tx) => {
      if (placed.placement.type === 'move' && placed.source) {
        await tx.calendarEvent.update({
          where: { id: placed.source.id },
          data: {
            date: performedDate,
            originDate: originDateAfterMove(placed.source.date, performedDate, placed.source.originDate),
            planDayId: input.requestedPlanDayId,
            title: placed.requestedTitle ?? placed.source.title,
          },
        });
        return;
      }
      await tx.calendarEvent.create({
        data: {
          clientId: input.clientId,
          coachMembershipId: input.coachMembershipId,
          date: performedDate,
          planDayId: input.requestedPlanDayId,
          title: placed.requestedTitle,
          type: 'workout',
        },
      });
    });
  }

  private async notifyCoach(context: AuthContext, placed: PlacementContext): Promise<void> {
    const thread = await this.chatRepository.resolveThread(context, {});
    await this.chatRepository.sendMessage(context, {
      text: coachMoveMessage({
        fromDate: placed.placement.type === 'move' ? (placed.source?.date ?? null) : null,
        requestedTitle: placed.requestedTitle,
      }),
      threadId: thread.id,
    });
  }

  private async loadPlanDays(requestedPlanDayId: string): Promise<PlanDayRef[]> {
    const anchor = await this.prisma.planDay.findFirst({
      where: { archivedAt: null, id: requestedPlanDayId },
      select: { templateId: true, revisionVersion: true },
    });
    if (!anchor) return [];
    return this.prisma.planDay.findMany({
      where: { archivedAt: null, templateId: anchor.templateId, revisionVersion: anchor.revisionVersion },
      select: { dayIndex: true, id: true, title: true },
      orderBy: { dayIndex: 'asc' },
    });
  }

  private async loadCandidateWorkouts(
    input: ClientCalendarPlanDaySwapInput,
    range: { from: Date; to: Date },
  ): Promise<CalendarWorkoutEvent[]> {
    return this.prisma.calendarEvent.findMany({
      where: {
        archivedAt: null,
        clientId: input.clientId,
        coachMembershipId: input.coachMembershipId,
        date: { gte: range.from, lte: range.to },
        type: 'workout',
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: { date: true, id: true, originDate: true, planDayId: true, title: true },
    });
  }

  private async loadCompletedKeys(
    input: ClientCalendarPlanDaySwapInput,
    range: { from: Date; to: Date },
  ): Promise<Set<string>> {
    const rows = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId: input.clientId,
        isCompleted: true,
        sessionDate: { gte: range.from, lte: range.to },
      },
      select: { planDayId: true, sessionDate: true },
    });
    const keys = new Set<string>();
    for (const row of rows) rememberCompletedSession(keys, input.clientId, row.sessionDate, row.planDayId);
    return keys;
  }
}

export class DayChangeConfirmationRequiredError extends ConflictException {
  constructor() {
    super('DAY_CHANGE_CONFIRMATION_REQUIRED');
  }
}
