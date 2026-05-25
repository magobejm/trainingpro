import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type ClientCalendarSummary = {
  completedDays: number;
  currentStreakWeeks: number;
  avgMotivation: number | null;
};

type GetClientCalendarSummaryInput = {
  dateFrom: Date;
  dateTo: Date;
};

@Injectable()
export class GetClientCalendarSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: GetClientCalendarSummaryInput): Promise<ClientCalendarSummary> {
    const client = await this.resolveClient(context);
    const [rangeRows, streakRows] = await Promise.all([
      this.queryRange(client.id, input.dateFrom, input.dateTo),
      this.queryStreakSessions(client.id),
    ]);
    const completedRows = rangeRows.filter((r) => r.isCompleted);
    const completedDays = completedRows.length;
    const motivations = completedRows.filter((r) => r.preMotivation !== null).map((r) => r.preMotivation!);
    const avgMotivation = motivations.length > 0 ? motivations.reduce((a, b) => a + b, 0) / motivations.length : null;
    const currentStreakWeeks = this.computeStreakWeeks(streakRows.map((r) => r.sessionDate));
    return { completedDays, currentStreakWeeks, avgMotivation };
  }

  private async queryRange(clientId: string, dateFrom: Date, dateTo: Date) {
    return this.prisma.sessionInstance.findMany({
      where: { clientId, archivedAt: null, sessionDate: { gte: dateFrom, lte: dateTo } },
      select: { isCompleted: true, preMotivation: true },
    });
  }

  private async queryStreakSessions(clientId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 365);
    return this.prisma.sessionInstance.findMany({
      where: { clientId, archivedAt: null, isCompleted: true, sessionDate: { gte: since } },
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
