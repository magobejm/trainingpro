export { MOOD_EMOJI } from './client-calendar.helpers';

const WELLNESS_RANGE_DAYS = 84;

export function buildDefaultWellnessRange(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - WELLNESS_RANGE_DAYS);
  return { dateFrom: toDateStr(from), dateTo: toDateStr(to) };
}

export function formatScore(value: null | number): string {
  if (value === null || value === undefined) return '–';
  return String(value);
}

export function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' });
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function hasWellnessData(session: {
  postFatigue: null | number;
  postMood: null | number;
  postPain: null | number;
  preFatigue: null | number;
  preMotivation: null | number;
  preRecovery: null | number;
}): boolean {
  return (
    session.preMotivation !== null ||
    session.preRecovery !== null ||
    session.preFatigue !== null ||
    session.postMood !== null ||
    session.postFatigue !== null ||
    session.postPain !== null
  );
}
