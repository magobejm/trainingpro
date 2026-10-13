export const STATUS_WINDOW_DAYS = 14;
export const ADHERENCE_RED_RATIO = 0.5;
export const ADHERENCE_AMBER_RATIO = 0.8;
export const MOOD_LOW_MAX = 4;
export const INACTIVE_AMBER_DAYS = 7;
export const INACTIVE_RED_DAYS = 14;
export const MIN_SESSIONS_FOR_ADHERENCE = 2;
const MS_PER_DAY = 86_400_000;

export type ClientStatusLevel = 'amber' | 'green' | 'none' | 'red';
export type ClientStatusReasonCode = 'adherence_low' | 'inactive' | 'incident_open' | 'incident_severe' | 'mood_low';

export type ClientStatusReason = {
  code: ClientStatusReasonCode;
  adherencePercent?: number;
  days?: number;
  mood?: number;
};

export type ClientStatus = {
  level: ClientStatusLevel;
  reasons: ClientStatusReason[];
};

export type ClientStatusInput = {
  completedSessions: number;
  daysSinceActivity: number | null;
  hasAnySession: boolean;
  hasPlan: boolean;
  latestMood: number | null;
  openIncidents: number;
  plannedSessions: number;
  severeOpenIncidents: number;
};

type ScoredReason = { level: 'amber' | 'red'; reason: ClientStatusReason };

/** Semáforo de un cliente a partir de sesiones, ánimo, incidencias y días sin actividad. */
export function computeClientStatus(input: ClientStatusInput): ClientStatus {
  if (!input.hasPlan && !input.hasAnySession) return { level: 'none', reasons: [] };
  const scored = [...incidentReasons(input), ...adherenceReasons(input), ...moodReasons(input), ...inactivityReasons(input)];
  const level = scored.some((item) => item.level === 'red') ? 'red' : scored.length ? 'amber' : 'green';
  return { level, reasons: scored.map((item) => item.reason) };
}

export function daysSinceActivity(at: Date | null, now: Date): number | null {
  if (!at) return null;
  const from = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  const to = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((to - from) / MS_PER_DAY));
}

/** Primer día incluido en la ventana de 14 días, en UTC. */
export function statusWindowStart(now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (STATUS_WINDOW_DAYS - 1));
  return start;
}

function incidentReasons(input: ClientStatusInput): ScoredReason[] {
  const reasons: ScoredReason[] = [];
  if (input.severeOpenIncidents > 0) reasons.push({ level: 'red', reason: { code: 'incident_severe' } });
  if (input.openIncidents - input.severeOpenIncidents > 0) {
    reasons.push({ level: 'amber', reason: { code: 'incident_open' } });
  }
  return reasons;
}

function adherenceReasons(input: ClientStatusInput): ScoredReason[] {
  if (input.plannedSessions < MIN_SESSIONS_FOR_ADHERENCE) return [];
  const ratio = input.completedSessions / input.plannedSessions;
  const adherencePercent = Math.round(ratio * 100);
  if (ratio < ADHERENCE_RED_RATIO) return [{ level: 'red', reason: { code: 'adherence_low', adherencePercent } }];
  if (ratio < ADHERENCE_AMBER_RATIO) return [{ level: 'amber', reason: { code: 'adherence_low', adherencePercent } }];
  return [];
}

function moodReasons(input: ClientStatusInput): ScoredReason[] {
  if (input.latestMood === null || input.latestMood > MOOD_LOW_MAX) return [];
  return [{ level: 'amber', reason: { code: 'mood_low', mood: input.latestMood } }];
}

function inactivityReasons(input: ClientStatusInput): ScoredReason[] {
  if (!input.hasPlan) return [];
  if (input.daysSinceActivity === null) return [{ level: 'red', reason: { code: 'inactive' } }];
  if (input.daysSinceActivity > INACTIVE_RED_DAYS) {
    return [{ level: 'red', reason: { code: 'inactive', days: input.daysSinceActivity } }];
  }
  if (input.daysSinceActivity >= INACTIVE_AMBER_DAYS) {
    return [{ level: 'amber', reason: { code: 'inactive', days: input.daysSinceActivity } }];
  }
  return [];
}
