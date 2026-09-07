import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { resolvePlanDayIdFromCalendarEvent, type PlanDayRef } from '../../../../common/plan/resolve-plan-day-from-calendar';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { CHAT_REPOSITORY, type ChatRepositoryPort } from '../../../chat/domain/chat.repository.port';

export type ClientCalendarPlanDaySwapInput = {
  clientId: string;
  coachMembershipId: string;
  requestedPlanDayId: string;
  sessionDate: Date;
};

type CalendarWorkoutEvent = {
  date: Date;
  id: string;
  planDayId: string | null;
  title: string | null;
};

@Injectable()
export class ClientCalendarPlanDaySwapService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
  ) {}

  async needsSwap(input: ClientCalendarPlanDaySwapInput): Promise<boolean> {
    const planDays = await this.loadPlanDays(input.requestedPlanDayId);
    const events = await this.loadWeekWorkouts(input);
    const todayEvent = this.findTodayEvent(events, input.sessionDate);
    const todayPlanDayId = todayEvent ? this.resolveEventPlanDayId(todayEvent, planDays) : null;
    return todayPlanDayId !== input.requestedPlanDayId;
  }

  async execute(context: AuthContext, input: ClientCalendarPlanDaySwapInput): Promise<void> {
    const planDays = await this.loadPlanDays(input.requestedPlanDayId);
    const events = await this.loadWeekWorkouts(input);
    const todayEvent = this.findTodayEvent(events, input.sessionDate);
    const todayPlanDayId = todayEvent ? this.resolveEventPlanDayId(todayEvent, planDays) : null;

    if (todayPlanDayId === input.requestedPlanDayId) {
      return;
    }

    const sourceEvent = this.findSourceEvent(events, input, planDays);
    const requestedPlanDay = planDays.find((day) => day.id === input.requestedPlanDayId) ?? null;
    const todayPlanDay = todayPlanDayId ? (planDays.find((day) => day.id === todayPlanDayId) ?? null) : null;

    await this.prisma.$transaction(async (tx) => {
      if (todayEvent && sourceEvent && todayEvent.id !== sourceEvent.id) {
        await tx.calendarEvent.update({
          where: { id: todayEvent.id },
          data: {
            planDayId: input.requestedPlanDayId,
            title: requestedPlanDay?.title ?? todayEvent.title,
          },
        });
        await tx.calendarEvent.update({
          where: { id: sourceEvent.id },
          data: {
            planDayId: todayPlanDayId,
            title: todayPlanDay?.title ?? sourceEvent.title,
          },
        });
        return;
      }

      if (todayEvent) {
        await tx.calendarEvent.update({
          where: { id: todayEvent.id },
          data: {
            planDayId: input.requestedPlanDayId,
            title: requestedPlanDay?.title ?? todayEvent.title,
          },
        });
        return;
      }

      if (sourceEvent) {
        await tx.calendarEvent.update({
          where: { id: sourceEvent.id },
          data: {
            date: this.normalizeDate(input.sessionDate),
            planDayId: input.requestedPlanDayId,
            title: requestedPlanDay?.title ?? sourceEvent.title,
          },
        });
      }
    });

    await this.notifyCoach(context, todayPlanDay?.title ?? null, requestedPlanDay?.title ?? null);
  }

  private findSourceEvent(
    events: CalendarWorkoutEvent[],
    input: ClientCalendarPlanDaySwapInput,
    planDays: PlanDayRef[],
  ): CalendarWorkoutEvent | null {
    const todayKey = this.toDateKey(input.sessionDate);
    return (
      events.find((event) => {
        if (this.toDateKey(event.date) === todayKey) {
          return false;
        }
        return this.resolveEventPlanDayId(event, planDays) === input.requestedPlanDayId;
      }) ?? null
    );
  }

  resolveEventPlanDayId(event: CalendarWorkoutEvent, planDays: PlanDayRef[]): string | null {
    return resolvePlanDayIdFromCalendarEvent(event, planDays);
  }

  private async loadPlanDays(requestedPlanDayId: string): Promise<PlanDayRef[]> {
    const anchor = await this.prisma.planDay.findFirst({
      where: { archivedAt: null, id: requestedPlanDayId },
      select: { templateId: true },
    });
    if (!anchor) {
      return [];
    }
    return this.prisma.planDay.findMany({
      where: { archivedAt: null, templateId: anchor.templateId },
      select: { dayIndex: true, id: true, title: true },
      orderBy: { dayIndex: 'asc' },
    });
  }

  private async notifyCoach(
    context: AuthContext,
    previousPlanDayTitle: string | null,
    requestedPlanDayTitle: string | null,
  ): Promise<void> {
    const thread = await this.chatRepository.resolveThread(context, {});
    const previousLabel = previousPlanDayTitle ?? 'descanso';
    const requestedLabel = requestedPlanDayTitle ?? 'otro día';
    const text =
      `He cambiado el entrenamiento de hoy: en lugar de "${previousLabel}" ` +
      `haré "${requestedLabel}". El calendario se ha actualizado automáticamente.`;
    await this.chatRepository.sendMessage(context, {
      text,
      threadId: thread.id,
    });
  }

  private async loadWeekWorkouts(input: ClientCalendarPlanDaySwapInput): Promise<CalendarWorkoutEvent[]> {
    const weekStart = this.startOfWeekMonday(input.sessionDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return this.prisma.calendarEvent.findMany({
      where: {
        archivedAt: null,
        clientId: input.clientId,
        coachMembershipId: input.coachMembershipId,
        date: { gte: weekStart, lte: weekEnd },
        type: 'workout',
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: {
        date: true,
        id: true,
        planDayId: true,
        title: true,
      },
    });
  }

  private findTodayEvent(events: CalendarWorkoutEvent[], sessionDate: Date): CalendarWorkoutEvent | undefined {
    const todayKey = this.toDateKey(sessionDate);
    return events.find((event) => this.toDateKey(event.date) === todayKey);
  }

  private startOfWeekMonday(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}

export class DayChangeConfirmationRequiredError extends ConflictException {
  constructor() {
    super('DAY_CHANGE_CONFIRMATION_REQUIRED');
  }
}
