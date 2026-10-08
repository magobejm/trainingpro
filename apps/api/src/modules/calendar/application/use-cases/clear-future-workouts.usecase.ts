import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  calendarDayKey,
  parseCalendarDay,
  selectWorkoutIdsToClear,
  type ClearableCalendarEvent,
} from '../../domain/clear-future-workouts';

export type ClearFutureWorkoutsInput = {
  clientId: string;
  from: string;
};

@Injectable()
export class ClearFutureWorkoutsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: ClearFutureWorkoutsInput): Promise<{ archived: number }> {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can clear future workouts');
    }
    const membership = await this.readCoachMembership(context.subject);
    await this.assertClient(membership.id, input.clientId);
    const ids = await this.workoutIds(membership.id, input);
    if (ids.length === 0) return { archived: 0 };
    const result = await this.prisma.calendarEvent.updateMany({
      where: { id: { in: ids }, coachMembershipId: membership.id, clientId: input.clientId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    return { archived: result.count };
  }

  private async workoutIds(coachMembershipId: string, input: ClearFutureWorkoutsInput): Promise<string[]> {
    const fromDate = parseCalendarDay(input.from);
    const [events, sessions] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: { coachMembershipId, clientId: input.clientId, archivedAt: null, date: { gte: fromDate } },
        select: { id: true, type: true, date: true, clientId: true },
      }),
      this.prisma.sessionInstance.findMany({
        where: {
          archivedAt: null,
          coachMembershipId,
          clientId: input.clientId,
          isCompleted: true,
          sessionDate: { gte: fromDate },
        },
        select: { clientId: true, sessionDate: true },
      }),
    ]);
    const completed = new Set(sessions.map((row) => calendarDayKey(row.clientId, row.sessionDate.toISOString())));
    return selectWorkoutIdsToClear(events.map(toClearable), completed, input.from);
  }

  private async assertClient(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { id: true },
    });
    if (!client) throw new ForbiddenException('Client not found for current coach');
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

function toClearable(event: { id: string; type: string; date: Date; clientId: string | null }): ClearableCalendarEvent {
  return { id: event.id, type: event.type, date: event.date.toISOString(), clientId: event.clientId };
}
