import type { WeeklyReportView } from '../../domain/weekly-report.entity';

type Row = {
  adherencePercent: null | number;
  energy: null | number;
  id: string;
  mood: null | number;
  notes: null | string;
  reportDate: Date;
  sleepHours: null | { toNumber: () => number };
  sourceSessionId: null | string;
  weekStartDate: Date;
};

export function mapWeeklyReport(row: Row): WeeklyReportView {
  return {
    adherencePercent: row.adherencePercent,
    energy: row.energy,
    id: row.id,
    mood: row.mood,
    notes: row.notes,
    reportDate: row.reportDate,
    sleepHours: row.sleepHours ? row.sleepHours.toNumber() : null,
    sourceSessionId: row.sourceSessionId,
    weekStartDate: row.weekStartDate,
  };
}
