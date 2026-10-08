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
  originDate: Date | null;
  planDayId: string | null;
  title: string | null;
};

export function originDateAfterMove(planned: Date, performed: Date, previousOrigin: Date | null): Date | null {
  const origin = previousOrigin ?? planned;
  return utcDateKey(origin) === utcDateKey(performed) ? null : origin;
}

export function utcCalendarDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function utcDateKey(date: Date): string {
  return utcCalendarDate(date).toISOString().slice(0, 10);
}

export function startOfUtcWeekMonday(date: Date): Date {
  const start = utcCalendarDate(date);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}

export function pickSourceEvent<T extends { date: Date }>(
  events: T[],
  todayKey: string,
  isRequested: (event: T) => boolean,
): T | null {
  const candidates = events.filter((event) => utcDateKey(event.date) !== todayKey && isRequested(event));
  const future = candidates
    .filter((event) => utcDateKey(event.date) > todayKey)
    .sort((left, right) => utcDateKey(left.date).localeCompare(utcDateKey(right.date)));
  if (future[0]) return future[0];
  const past = candidates
    .filter((event) => utcDateKey(event.date) < todayKey)
    .sort((left, right) => utcDateKey(right.date).localeCompare(utcDateKey(left.date)));
  return past[0] ?? null;
}

@Injectable()
export class ClientCalendarPlanDaySwapService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
  ) {}

  async needsSwap(input: ClientCalendarPlanDaySwapInput): Promise<boolean> {
    const planDays = await this.loadPlanDays(input.requestedPlanDayId);
    const events = await this.loadCandidateWorkouts(input);
    const todayEvent = this.findTodayEvent(events, input.sessionDate);
    const todayPlanDayId = todayEvent ? this.resolveEventPlanDayId(todayEvent, planDays) : null;
    return todayPlanDayId !== input.requestedPlanDayId;
  }

  async execute(context: AuthContext, input: ClientCalendarPlanDaySwapInput): Promise<void> {
    const planDays = await this.loadPlanDays(input.requestedPlanDayId);
    const events = await this.loadCandidateWorkouts(input);
    const todayEvent = this.findTodayEvent(events, input.sessionDate);
    const todayPlanDayId = todayEvent ? this.resolveEventPlanDayId(todayEvent, planDays) : null;

    if (todayPlanDayId === input.requestedPlanDayId) {
      return;
    }

    const sourceEvent = pickSourceEvent(events, utcDateKey(input.sessionDate), (event) => {
      return this.resolveEventPlanDayId(event, planDays) === input.requestedPlanDayId;
    });
    const requestedPlanDay = planDays.find((day) => day.id === input.requestedPlanDayId) ?? null;
    const todayPlanDay = todayPlanDayId ? (planDays.find((day) => day.id === todayPlanDayId) ?? null) : null;
    const changed = await this.persistSwap({
      input,
      requestedPlanDay,
      sourceEvent,
      todayEvent,
      todayPlanDay,
      todayPlanDayId,
    });
    await this.notifyCoach(context, todayPlanDay?.title ?? null, requestedPlanDay?.title ?? null, changed);
  }

  private async persistSwap(swap: {
    input: ClientCalendarPlanDaySwapInput;
    requestedPlanDay: PlanDayRef | null;
    sourceEvent: CalendarWorkoutEvent | null;
    todayEvent: CalendarWorkoutEvent | undefined;
    todayPlanDay: PlanDayRef | null;
    todayPlanDayId: string | null;
  }): Promise<boolean> {
    const performedDate = utcCalendarDate(swap.input.sessionDate);
    const requestedTitle = swap.requestedPlanDay?.title ?? swap.todayEvent?.title ?? null;
    return this.prisma.$transaction(async (tx) => {
      if (swap.todayEvent && swap.sourceEvent && swap.todayEvent.id !== swap.sourceEvent.id) {
        await tx.calendarEvent.update({
          where: { id: swap.todayEvent.id },
          data: {
            originDate: originDateAfterMove(swap.sourceEvent.date, swap.todayEvent.date, swap.sourceEvent.originDate),
            planDayId: swap.input.requestedPlanDayId,
            title: requestedTitle,
          },
        });
        await tx.calendarEvent.update({
          where: { id: swap.sourceEvent.id },
          data: {
            originDate: null,
            planDayId: swap.todayPlanDayId,
            title: swap.todayPlanDay?.title ?? swap.sourceEvent.title,
          },
        });
        return true;
      }

      if (swap.todayEvent) {
        await tx.calendarEvent.update({
          where: { id: swap.todayEvent.id },
          data: { planDayId: swap.input.requestedPlanDayId, title: requestedTitle },
        });
        return true;
      }

      if (swap.sourceEvent) {
        await tx.calendarEvent.update({
          where: { id: swap.sourceEvent.id },
          data: {
            date: performedDate,
            originDate: originDateAfterMove(swap.sourceEvent.date, performedDate, swap.sourceEvent.originDate),
            planDayId: swap.input.requestedPlanDayId,
            title: swap.requestedPlanDay?.title ?? swap.sourceEvent.title,
          },
        });
        return true;
      }

      return false;
    });
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
    calendarChanged: boolean,
  ): Promise<void> {
    const thread = await this.chatRepository.resolveThread(context, {});
    const previousLabel = previousPlanDayTitle ?? 'descanso';
    const requestedLabel = requestedPlanDayTitle ?? 'otro día';
    const text = calendarChanged
      ? `He cambiado el entrenamiento de hoy: en lugar de "${previousLabel}" ` +
        `haré "${requestedLabel}". El calendario se ha actualizado automáticamente.`
      : `He empezado "${requestedLabel}" aunque hoy tocaba "${previousLabel}". ` +
        'Ese día no estaba en el calendario, así que la planificación no se ha movido.';
    await this.chatRepository.sendMessage(context, {
      text,
      threadId: thread.id,
    });
  }

  private async loadCandidateWorkouts(input: ClientCalendarPlanDaySwapInput): Promise<CalendarWorkoutEvent[]> {
    const weekStart = startOfUtcWeekMonday(input.sessionDate);
    const rangeEnd = new Date(weekStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 27);

    return this.prisma.calendarEvent.findMany({
      where: {
        archivedAt: null,
        clientId: input.clientId,
        coachMembershipId: input.coachMembershipId,
        date: { gte: weekStart, lte: rangeEnd },
        type: 'workout',
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: {
        date: true,
        id: true,
        originDate: true,
        planDayId: true,
        title: true,
      },
    });
  }

  private findTodayEvent(events: CalendarWorkoutEvent[], sessionDate: Date): CalendarWorkoutEvent | undefined {
    const todayKey = utcDateKey(sessionDate);
    return events.find((event) => utcDateKey(event.date) === todayKey);
  }
}

export class DayChangeConfirmationRequiredError extends ConflictException {
  constructor() {
    super('DAY_CHANGE_CONFIRMATION_REQUIRED');
  }
}
