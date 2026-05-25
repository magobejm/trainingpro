import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type ClientWellnessSession = {
  id: string;
  isCompleted: boolean;
  planDayTitle: string | null;
  postFatigue: number | null;
  postMood: number | null;
  postPain: number | null;
  preFatigue: number | null;
  preMotivation: number | null;
  preRecovery: number | null;
  sessionDate: string;
};

export type ClientWellnessWeeklyReport = {
  adherencePercent: number | null;
  energy: number | null;
  id: string;
  mood: number | null;
  reportDate: string;
  sleepHours: number | null;
  weekStartDate: string;
};

export type ClientWellnessSummary = {
  avgPostFatigue: number | null;
  avgPostMood: number | null;
  avgPreMotivation: number | null;
  reportsCount: number;
  sessionsWithWellness: number;
};

export type ClientWellnessResponse = {
  sessions: ClientWellnessSession[];
  summary: ClientWellnessSummary;
  weeklyReports: ClientWellnessWeeklyReport[];
};

type ListClientWellnessInput = {
  dateFrom: Date;
  dateTo: Date;
};

@Injectable()
export class ListClientWellnessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: ListClientWellnessInput): Promise<ClientWellnessResponse> {
    const client = await this.resolveClient(context);
    const [sessionRows, reportRows] = await Promise.all([
      this.querySessions(client.id, input.dateFrom, input.dateTo),
      this.queryWeeklyReports(client.id, input.dateFrom, input.dateTo),
    ]);
    const sessions = sessionRows.map((r) => ({
      id: r.id,
      isCompleted: r.isCompleted,
      planDayTitle: r.planDayTitle,
      postFatigue: r.postFatigue,
      postMood: r.postMood,
      postPain: r.postPain,
      preFatigue: r.preFatigue,
      preMotivation: r.preMotivation,
      preRecovery: r.preRecovery,
      sessionDate: r.sessionDate.toISOString().slice(0, 10),
    }));
    const weeklyReports = reportRows.map((r) => ({
      adherencePercent: r.adherencePercent,
      energy: r.energy,
      id: r.id,
      mood: r.mood,
      reportDate: r.reportDate.toISOString().slice(0, 10),
      sleepHours: r.sleepHours !== null ? Number(r.sleepHours) : null,
      weekStartDate: r.weekStartDate.toISOString().slice(0, 10),
    }));
    return {
      sessions,
      summary: buildSummary(sessions, weeklyReports),
      weeklyReports,
    };
  }

  private async querySessions(clientId: string, dateFrom: Date, dateTo: Date) {
    return this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId,
        sessionDate: { gte: dateFrom, lte: dateTo },
      },
      orderBy: [{ sessionDate: 'desc' }],
      select: {
        id: true,
        isCompleted: true,
        planDayTitle: true,
        postFatigue: true,
        postMood: true,
        postPain: true,
        preFatigue: true,
        preMotivation: true,
        preRecovery: true,
        sessionDate: true,
      },
    });
  }

  private async queryWeeklyReports(clientId: string, dateFrom: Date, dateTo: Date) {
    return this.prisma.weeklyReport.findMany({
      where: {
        clientId,
        reportDate: { gte: dateFrom, lte: dateTo },
      },
      orderBy: [{ reportDate: 'desc' }],
      select: {
        adherencePercent: true,
        energy: true,
        id: true,
        mood: true,
        reportDate: true,
        sleepHours: true,
        weekStartDate: true,
      },
    });
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

function buildSummary(
  sessions: ClientWellnessSession[],
  weeklyReports: ClientWellnessWeeklyReport[],
): ClientWellnessSummary {
  const moods = sessions.filter((s) => s.postMood !== null).map((s) => s.postMood!);
  const motivations = sessions.filter((s) => s.preMotivation !== null).map((s) => s.preMotivation!);
  const fatigues = sessions.filter((s) => s.postFatigue !== null).map((s) => s.postFatigue!);
  const sessionsWithWellness = sessions.filter(hasWellnessData).length;
  return {
    avgPostFatigue: average(fatigues),
    avgPostMood: average(moods),
    avgPreMotivation: average(motivations),
    reportsCount: weeklyReports.length,
    sessionsWithWellness,
  };
}

function hasWellnessData(session: ClientWellnessSession): boolean {
  return (
    session.preMotivation !== null ||
    session.preRecovery !== null ||
    session.preFatigue !== null ||
    session.postMood !== null ||
    session.postFatigue !== null ||
    session.postPain !== null
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
