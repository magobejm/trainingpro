import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { closeStaleSessions } from '../../../sessions/infra/prisma/session-stale';
import { readNutritionStreakWeeks } from '../nutrition-streak';

export type ClientCalendarSummary = {
  completedDays: number;
  currentStreakWeeks: number;
  nutritionStreakWeeks: number;
  avgMotivation: number | null;
};

export function countsAsDoneSession(row: { isCompleted: boolean; isIncomplete: boolean }): boolean {
  return row.isCompleted && !row.isIncomplete;
}

/** Media de la motivación de los check-ins (escala 1-5) expresada en la escala 1-10 del calendario. */
export function averageCheckinMotivation(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(mean * 2 * 100) / 100;
}

type GetClientCalendarSummaryInput = {
  dateFrom: Date;
  dateTo: Date;
};

@Injectable()
export class GetClientCalendarSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: GetClientCalendarSummaryInput): Promise<ClientCalendarSummary> {
    const client = await this.resolveClient(context);
    await closeStaleSessions(this.prisma, { clientId: client.id });
    const [rangeRows, streakRows] = await Promise.all([
      this.queryRange(client.id, input.dateFrom, input.dateTo),
      this.queryStreakSessions(client.id),
    ]);
    const completedRows = rangeRows.filter((r) => countsAsDoneSession(r));
    const completedDays = completedRows.length;
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { clientId: client.id, date: { gte: input.dateFrom, lte: input.dateTo } },
      select: { motivation: true },
    });
    const avgMotivation = averageCheckinMotivation(checkins.map((row) => row.motivation));
    const currentStreakWeeks = this.computeStreakWeeks(streakRows.map((r) => r.sessionDate));
    const nutritionStreakWeeks = await readNutritionStreakWeeks(this.prisma, client.id);
    return { avgMotivation, completedDays, currentStreakWeeks, nutritionStreakWeeks };
  }

  private async queryRange(clientId: string, dateFrom: Date, dateTo: Date) {
    return this.prisma.sessionInstance.findMany({
      where: { clientId, archivedAt: null, sessionDate: { gte: dateFrom, lte: dateTo } },
      select: { isCompleted: true, isIncomplete: true, preMotivation: true },
    });
  }

  private async queryStreakSessions(clientId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 365);
    return this.prisma.sessionInstance.findMany({
      where: { clientId, archivedAt: null, isCompleted: true, isIncomplete: false, sessionDate: { gte: since } },
      select: { sessionDate: true },
      orderBy: { sessionDate: 'desc' },
    });
  }

  private computeStreakWeeks(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const weekKeys = new Set(dates.map((d) => this.isoWeekKey(d)));
    let streak = 0;
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
    cursor.setHours(0, 0, 0, 0);
    while (weekKeys.has(this.isoWeekKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 7);
    }
    return streak;
  }

  private isoWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
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
