import { aggregateCardioWeekly } from '../../progress/domain/metrics/cardio-weekly.metric';
import { aggregateSrpeWeekly } from '../../progress/domain/metrics/srpe';
import { aggregateStrengthWeekly } from '../../progress/domain/metrics/strength-weekly.metric';
import type {
  CardioLogRow,
  CardioWeeklyPoint,
  SessionSrpeRow,
  SrpeWeeklyPoint,
  StrengthLogRow,
  StrengthWeeklyPoint,
} from '../../progress/domain/progress.models';
import type { ReportPdfInput } from '../domain/report-pdf.models';

export type WeeklyReportLineSource = {
  adherencePercent: null | number;
  energy: null | number;
  mood: null | number;
  reportDate: Date;
  sleepHours: unknown;
};

export function buildWeeklyReportLines(
  data: {
    cardioRows: CardioLogRow[];
    srpeRows: SessionSrpeRow[];
    strengthRows: StrengthLogRow[];
    weeklyReports: WeeklyReportLineSource[];
  },
  input: ReportPdfInput,
): string[] {
  const lines = createHeaderLines(input);
  appendWeeklyReportLines(lines, data.weeklyReports);
  appendStrengthLines(lines, aggregateStrengthWeekly(data.strengthRows));
  appendCardioLines(lines, aggregateCardioWeekly(data.cardioRows));
  appendSrpeLines(lines, aggregateSrpeWeekly(data.srpeRows));
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

function appendWeeklyReportLines(lines: string[], reports: WeeklyReportLineSource[]): void {
  for (const report of reports) {
    lines.push(buildWeeklyReportLine(report));
  }
}

function buildWeeklyReportLine(report: WeeklyReportLineSource): string {
  const left = `${toDateKey(report.reportDate)} mood:${valueOrDash(report.mood)}`;
  const middle = `energy:${valueOrDash(report.energy)} sleep:${valueOrDash(report.sleepHours)}`;
  const right = `adherence:${valueOrDash(report.adherencePercent)}`;
  return `${left} ${middle} ${right}`;
}

function appendStrengthLines(lines: string[], points: StrengthWeeklyPoint[]): void {
  lines.push('--- Progreso fuerza ---');
  for (const point of points) {
    lines.push(`${point.weekStart} ${point.muscleGroup} volume:${Math.round(point.volumeKg)}`);
  }
}

function appendCardioLines(lines: string[], points: CardioWeeklyPoint[]): void {
  lines.push('--- Progreso cardio ---');
  for (const point of points) {
    lines.push(buildCardioLine(point));
  }
}

function buildCardioLine(point: CardioWeeklyPoint): string {
  const minutes = Math.round(point.totalDurationSeconds / 60);
  return `${point.weekStart} ${point.methodType} min:${minutes}`;
}

function appendSrpeLines(lines: string[], points: SrpeWeeklyPoint[]): void {
  lines.push('--- Intensidad sRPE ---');
  for (const point of points) {
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
