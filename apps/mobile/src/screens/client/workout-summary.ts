import type { ProgressRecord, SessionItem, SessionView } from '@trainerpro/shared';

export type WorkoutSummary = {
  durationSeconds: number | null;
  load: number | null;
  setsDone: number;
  setsPlanned: number;
  tonnageKg: number;
};

type SummaryInput = {
  performedDurationSeconds?: number | null;
  sessionRpe?: number | null;
};

export function buildWorkoutSummary(session: SessionView, input: SummaryInput = {}): WorkoutSummary {
  const durationSeconds = input.performedDurationSeconds ?? session.performedDurationSeconds ?? null;
  const sessionRpe = input.sessionRpe ?? session.sessionRpe;
  return {
    durationSeconds,
    load: sessionLoad(sessionRpe, durationSeconds),
    setsDone: session.items.reduce((total, item) => total + loggedSets(item), 0),
    setsPlanned: session.items.reduce((total, item) => total + plannedSets(item), 0),
    tonnageKg: Math.round(session.items.reduce((total, item) => total + itemTonnage(item), 0) * 10) / 10,
  };
}

export function recordsForSession(records: ProgressRecord[], sessionId: string): ProgressRecord[] {
  return records.filter((record) => record.sessionId === sessionId);
}

export function formatSummaryMinutes(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const minutes = Math.round((seconds / 60) * 10) / 10;
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

export function formatSummaryKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function sessionLoad(sessionRpe: number | null, durationSeconds: number | null): number | null {
  if (sessionRpe == null || durationSeconds == null || durationSeconds <= 0 || sessionRpe <= 0) return null;
  return Math.round(sessionRpe * (durationSeconds / 60) * 100) / 100;
}

function plannedSets(item: SessionItem): number {
  if (item.type === 'strength' || item.type === 'isometric') return item.setsPlanned ?? 1;
  if (item.type === 'sport') return item.plannedSets.length || 1;
  return item.roundsPlanned;
}

function loggedSets(item: SessionItem): number {
  if (item.type === 'cardio') return item.intervalLogs.length;
  if (item.type === 'sport') return item.setLogs.length || (item.log ? 1 : 0);
  return item.logs.length;
}

function itemTonnage(item: SessionItem): number {
  if (item.type === 'cardio') return 0;
  if (item.type === 'sport') return item.setLogs.reduce((total, log) => addLoad(total, log.weightDoneKg, log.repsDone), 0);
  if (item.type === 'isometric') return 0;
  return item.logs.reduce((total, log) => addLoad(total, log.weightDoneKg, log.repsDone), 0);
}

function addLoad(total: number, weight: number | null, reps: number | null | undefined): number {
  if (weight == null || reps == null || weight <= 0 || reps <= 0) return total;
  return total + weight * reps;
}
