import { formatDate } from '@trainerpro/shared';

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

export function formatDateLabel(dateStr: string, locale = 'es'): string {
  return formatDate(`${dateStr}T12:00:00`, locale);
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

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}
