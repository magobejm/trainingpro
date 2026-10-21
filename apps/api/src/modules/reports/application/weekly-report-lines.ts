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
    adherence?: {
      percent: number | null;
      cutoffDate: string;
      plannedCount: number;
      counts: { done: number; incomplete: number; skipped: number; pending: number; in_progress: number };
      unplannedSessionsCount: number;
    };
    sessions?: Array<{ sessionDate: string; outcome: string; originDate?: string | null; skipReason?: string | null }>;
  },
  input: ReportPdfInput,
): string[] {
  const lines = createHeaderLines(input);
  appendWeeklyReportLines(lines, data.weeklyReports);
  if (data.adherence) {
    const a = data.adherence;
    lines.push(
      '--- Adherencia calculada ---',
      `Completadas ${a.counts.done} / previstas ${a.plannedCount}; ` +
        `corte ${a.cutoffDate}; porcentaje ${valueOrDash(a.percent)}`,
      'Denominador: agenda real vencida hasta el corte. Hoy y fechas futuras excluidos.',
      `Incompletas ${a.counts.incomplete}; no hechas ${a.counts.skipped}; pendientes ${a.counts.pending}; ` +
        `en curso ${a.counts.in_progress}; sin agenda ${a.unplannedSessionsCount}`,
    );
    if (a.plannedCount === 0) lines.push('Sin entrenamientos previstos registrados');
  }
  if (data.sessions) {
    const labels: Record<string, string> = {
      done: 'Completado',
      incomplete: 'Incompleto',
      skipped: 'No hecho',
      pending: 'Pendiente',
      in_progress: 'En curso',
    };
    lines.push(
      '--- Sesiones: fecha y resultado ---',
      ...data.sessions.map(
        (session) =>
          `${session.sessionDate}: ${labels[session.outcome] ?? session.outcome}${session.originDate ? ` (origen ${session.originDate})` : ''}${session.skipReason ? ` - ${session.skipReason}` : ''}`,
      ),
    );
  }
  lines.push('Métricas: solo datos registrados en sesiones completadas o incompletas; sin registro = -.');
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
  const right = `adherencia declarada:${valueOrDash(report.adherencePercent)}`;
  return `${left} ${middle} ${right}`;
}

function appendStrengthLines(lines: string[], points: StrengthWeeklyPoint[]): void {
  lines.push('--- Progreso fuerza ---');
  for (const point of points) {
    lines.push(
      `${point.weekStart} ${point.muscleGroup} volume:${point.volumeKg === null ? '-' : Math.round(point.volumeKg)}`,
    );
    appendCoverage(lines, point.metricCoverage, 'volumeKg');
  }
}

function appendCardioLines(lines: string[], points: CardioWeeklyPoint[]): void {
  lines.push('--- Progreso cardio ---');
  for (const point of points) {
    lines.push(buildCardioLine(point));
    appendCoverage(lines, point.metricCoverage, 'totalDurationSeconds');
  }
}

function buildCardioLine(point: CardioWeeklyPoint): string {
  const minutes = point.totalDurationSeconds === null ? '-' : Math.round(point.totalDurationSeconds / 60);
  return `${point.weekStart} ${point.methodType} min:${minutes}`;
}

function appendSrpeLines(lines: string[], points: SrpeWeeklyPoint[]): void {
  lines.push('--- Intensidad sRPE ---');
  for (const point of points) {
    lines.push(`${point.weekStart} srpe:${point.totalSrpe === null ? '-' : Math.round(point.totalSrpe)}`);
    appendCoverage(lines, point.metricCoverage, 'totalSrpe');
  }
}

function appendCoverage(
  lines: string[],
  coverage: import('../../progress/domain/progress.models').MetricCoverage | undefined,
  key: 'volumeKg' | 'totalDurationSeconds' | 'totalSrpe',
): void {
  const sample = coverage?.[key];
  if (!sample) return;
  const unit = { sets: 'series', intervals: 'intervalos', sessions: 'sesiones' }[sample.unit];
  const label = { volumeKg: 'volumen', totalDurationSeconds: 'duración', totalSrpe: 'sRPE' }[key];
  lines.push(`Muestra ${label}: ${sample.validSamples}/${sample.eligibleSamples} ${unit}`);
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
