import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { CardioLogRow, SessionSrpeRow, StrengthLogRow } from '../../../progress/domain/progress.models';
import { aggregateCardioWeekly } from '../../../progress/domain/metrics/cardio-weekly.metric';
import { aggregateSrpeWeekly } from '../../../progress/domain/metrics/srpe';
import { aggregateStrengthWeekly } from '../../../progress/domain/metrics/strength-weekly.metric';
import type { ReportPdfFile, ReportPdfInput } from '../../domain/report-pdf.models';
import { buildSimplePdf } from '../../infra/pdf/simple-pdf.builder';

@Injectable()
export class ExportWeeklyPdfUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: ReportPdfInput): Promise<ReportPdfFile> {
    const coach = await this.resolveCoach(context);
    await this.assertClientOwnership(coach.id, input.clientId);
    const [weeklyReports, strengthRows, cardioRows, srpeRows] = await Promise.all([
      this.readWeeklyReports(input.clientId, input.from, input.to),
      this.readStrengthRows(input.clientId, input.from, input.to),
      this.readCardioRows(input.clientId, input.from, input.to),
      this.readSrpeRows(input.clientId, input.from, input.to),
    ]);
    const lines = buildLines({ cardioRows, srpeRows, strengthRows, weeklyReports }, input);
    return {
      data: buildSimplePdf(lines),
      fileName: `report-${input.clientId}-${toDateKey(input.to)}.pdf`,
    };
  }

  private async resolveCoach(context: AuthContext) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can export report PDF');
    }
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: context.subject },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Coach membership not found');
    }
    return membership;
  }

  private async assertClientOwnership(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new ForbiddenException('Client does not belong to coach');
    }
  }

  private readWeeklyReports(clientId: string, from: Date, to: Date) {
    return this.prisma.weeklyReport.findMany({
      where: { clientId, reportDate: { gte: from, lte: to } },
      orderBy: { reportDate: 'asc' },
      select: {
        adherencePercent: true,
        energy: true,
        mood: true,
        reportDate: true,
        sleepHours: true,
      },
    });
  }

  private async readStrengthRows(clientId: string, from: Date, to: Date): Promise<StrengthLogRow[]> {
    const rows = await this.prisma.setLog.findMany({
      where: buildDateWhere(clientId, from, to),
      select: {
        repsDone: true,
        session: { select: { sessionDate: true } },
        sessionItem: { select: { sourceExerciseId: true } },
        weightDoneKg: true,
      },
    });
    const map = await this.readMuscleGroupMap(rows.map((row) => row.sessionItem.sourceExerciseId));
    return rows.map((row) => ({
      muscleGroup: map.get(row.sessionItem.sourceExerciseId ?? '') ?? 'UNKNOWN',
      repsDone: row.repsDone,
      sessionDate: row.session.sessionDate,
      weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
    }));
  }

  private async readCardioRows(clientId: string, from: Date, to: Date): Promise<CardioLogRow[]> {
    const rows = await this.prisma.intervalLog.findMany({
      where: buildDateWhere(clientId, from, to),
      select: {
        avgHeartRate: true,
        distanceDoneMeters: true,
        durationSecondsDone: true,
        effortRpe: true,
        session: { select: { sessionDate: true } },
        sessionCardioBlock: { select: { sourceCardioMethodId: true } },
      },
    });
    const map = await this.readMethodTypeMap(rows.map((row) => row.sessionCardioBlock.sourceCardioMethodId));
    return rows.map((row) => ({
      avgHeartRate: row.avgHeartRate,
      distanceDoneMeters: row.distanceDoneMeters,
      durationSecondsDone: row.durationSecondsDone,
      effortRpe: row.effortRpe,
      methodType: map.get(row.sessionCardioBlock.sourceCardioMethodId ?? '') ?? 'UNKNOWN',
      sessionDate: row.session.sessionDate,
    }));
  }

  private async readSrpeRows(clientId: string, from: Date, to: Date): Promise<SessionSrpeRow[]> {
    const rows = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId,
        isCompleted: true,
        sessionDate: { gte: from, lte: to },
      },
      select: {
        finishedAt: true,
        intervalLogs: { select: { durationSecondsDone: true, effortRpe: true } },
        logs: { select: { effortRpe: true } },
        sessionDate: true,
        startedAt: true,
      },
    });
    return rows.map((row) => ({
      durationSeconds: readDurationSeconds(row.startedAt, row.finishedAt, row.intervalLogs),
      effortRpe: readSessionEffort(row.logs, row.intervalLogs),
      sessionDate: row.sessionDate,
    }));
  }

  private async readMethodTypeMap(ids: Array<null | string>): Promise<Map<string, string>> {
    const unique = uniqueIds(ids);
    if (unique.length === 0) {
      return new Map();
    }
    const methods = await this.prisma.cardioMethod.findMany({
      where: { id: { in: unique } },
      select: { id: true, methodTypeRef: { select: { label: true } } },
    });
    return new Map(methods.map((row) => [row.id, row.methodTypeRef.label]));
  }

  private async readMuscleGroupMap(ids: Array<null | string>): Promise<Map<string, string>> {
    const unique = uniqueIds(ids);
    if (unique.length === 0) {
      return new Map();
    }
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: unique } },
      select: { id: true, muscleGroups: { include: { muscleGroup: { select: { label: true } } } } },
    });
    return new Map(exercises.map((row) => [row.id, row.muscleGroups.map((mg) => mg.muscleGroup.label).join(', ')]));
  }
}

function buildDateWhere(clientId: string, from: Date, to: Date) {
  return {
    session: {
      archivedAt: null,
      clientId,
      isCompleted: true,
      sessionDate: { gte: from, lte: to },
    },
  };
}

function uniqueIds(items: Array<null | string>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)))];
}

function readDurationSeconds(
  startedAt: Date | null,
  finishedAt: Date | null,
  intervalLogs: Array<{ durationSecondsDone: null | number }>,
): null | number {
  if (startedAt && finishedAt && finishedAt > startedAt) {
    return Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
  }
  const intervalDuration = intervalLogs.reduce((sum, row) => sum + (row.durationSecondsDone ?? 0), 0);
  return intervalDuration > 0 ? intervalDuration : null;
}

function readSessionEffort(
  setLogs: Array<{ effortRpe: null | number }>,
  intervalLogs: Array<{ effortRpe: null | number }>,
): null | number {
  const values = [...setLogs, ...intervalLogs]
    .map((row) => row.effortRpe)
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(avg * 100) / 100;
}

function buildLines(
  data: {
    cardioRows: CardioLogRow[];
    srpeRows: SessionSrpeRow[];
    strengthRows: StrengthLogRow[];
    weeklyReports: Awaited<ReturnType<ExportWeeklyPdfUseCase['readWeeklyReports']>>;
  },
  input: ReportPdfInput,
): string[] {
  const strengthWeekly = aggregateStrengthWeekly(data.strengthRows);
  const cardioWeekly = aggregateCardioWeekly(data.cardioRows);
  const srpeWeekly = aggregateSrpeWeekly(data.srpeRows);
  const lines = createHeaderLines(input);
  appendWeeklyReportLines(lines, data.weeklyReports);
  appendStrengthLines(lines, strengthWeekly);
  appendCardioLines(lines, cardioWeekly);
  appendSrpeLines(lines, srpeWeekly);
  return lines;
}

function createHeaderLines(input: ReportPdfInput): string[] {
  return [
    'Trainer Pro - Reporte PDF',
    `Cliente: ${input.clientId}`,
    `Rango: ${toDateKey(input.from)} a ${toDateKey(input.to)}`,
    '--- Resumen semanal ---',
  ];
}

function appendWeeklyReportLines(
  lines: string[],
  reports: Awaited<ReturnType<ExportWeeklyPdfUseCase['readWeeklyReports']>>,
): void {
  for (const report of reports.slice(0, 6)) {
    lines.push(buildWeeklyReportLine(report));
  }
}

function buildWeeklyReportLine(report: {
  adherencePercent: null | number;
  energy: null | number;
  mood: null | number;
  reportDate: Date;
  sleepHours: unknown;
}): string {
  const left = `${toDateKey(report.reportDate)} mood:${valueOrDash(report.mood)}`;
  const middle = `energy:${valueOrDash(report.energy)} sleep:${valueOrDash(report.sleepHours)}`;
  const right = `adherence:${valueOrDash(report.adherencePercent)}`;
  return `${left} ${middle} ${right}`;
}

function appendStrengthLines(lines: string[], points: ReturnType<typeof aggregateStrengthWeekly>): void {
  lines.push('--- Progreso fuerza ---');
  for (const point of points.slice(0, 8)) {
    lines.push(`${point.weekStart} ${point.muscleGroup} volume:${Math.round(point.volumeKg)}`);
  }
}

function appendCardioLines(lines: string[], points: ReturnType<typeof aggregateCardioWeekly>): void {
  lines.push('--- Progreso cardio ---');
  for (const point of points.slice(0, 8)) {
    lines.push(buildCardioLine(point));
  }
}

function buildCardioLine(point: { methodType: string; totalDurationSeconds: number; weekStart: string }): string {
  const minutes = Math.round(point.totalDurationSeconds / 60);
  return `${point.weekStart} ${point.methodType} min:${minutes}`;
}

function appendSrpeLines(lines: string[], points: ReturnType<typeof aggregateSrpeWeekly>): void {
  lines.push('--- Intensidad sRPE ---');
  for (const point of points.slice(0, 8)) {
    lines.push(`${point.weekStart} srpe:${Math.round(point.totalSrpe)}`);
  }
}

function toDateKey(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function valueOrDash(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${value}`;
}
