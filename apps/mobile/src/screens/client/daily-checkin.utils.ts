import { deviceTimezoneOffsetMinutes } from '../../data/api-client';

export type MorningCheckinScores = {
  motivation: number;
  recovery: number;
  sleep: number;
};

export type MorningScaleOption = {
  emoji: string;
  labelKey: string;
  value: number;
};

export const SLEEP_OPTIONS: MorningScaleOption[] = [
  { value: 1, emoji: '😫', labelKey: 'mobile.client.checkin.sleep.1' },
  { value: 2, emoji: '🥱', labelKey: 'mobile.client.checkin.sleep.2' },
  { value: 3, emoji: '😐', labelKey: 'mobile.client.checkin.sleep.3' },
  { value: 4, emoji: '🙂', labelKey: 'mobile.client.checkin.sleep.4' },
  { value: 5, emoji: '😴', labelKey: 'mobile.client.checkin.sleep.5' },
];

export const MOTIVATION_OPTIONS: MorningScaleOption[] = [
  { value: 1, emoji: '😞', labelKey: 'mobile.client.checkin.motivation.1' },
  { value: 2, emoji: '😕', labelKey: 'mobile.client.checkin.motivation.2' },
  { value: 3, emoji: '😐', labelKey: 'mobile.client.checkin.motivation.3' },
  { value: 4, emoji: '😊', labelKey: 'mobile.client.checkin.motivation.4' },
  { value: 5, emoji: '🔥', labelKey: 'mobile.client.checkin.motivation.5' },
];

export const RECOVERY_OPTIONS: MorningScaleOption[] = [
  { value: 1, emoji: '🪫', labelKey: 'mobile.client.checkin.recovery.1' },
  { value: 2, emoji: '🤕', labelKey: 'mobile.client.checkin.recovery.2' },
  { value: 3, emoji: '😐', labelKey: 'mobile.client.checkin.recovery.3' },
  { value: 4, emoji: '🔋', labelKey: 'mobile.client.checkin.recovery.4' },
  { value: 5, emoji: '⚡', labelKey: 'mobile.client.checkin.recovery.5' },
];

export type DailyCheckinEntry = {
  date: string;
  scores: MorningCheckinScores | null;
};

export type DailyCheckinEntries = Record<string, DailyCheckinEntry>;

export function localDateKey(date: Date = new Date(), offsetMinutes: number = deviceTimezoneOffsetMinutes()): string {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function readTodayCheckin(
  entries: DailyCheckinEntries,
  userId: string | null,
  today: string,
): DailyCheckinEntry | null {
  if (!userId) {
    return null;
  }
  const entry = entries[userId];
  if (!entry || entry.date !== today) {
    return null;
  }
  return entry;
}

export function writeTodayCheckin(
  entries: DailyCheckinEntries,
  userId: string,
  date: string,
  scores: MorningCheckinScores | null,
): DailyCheckinEntries {
  const next: DailyCheckinEntries = {};
  for (const [id, entry] of Object.entries(entries)) {
    if (entry.date === date) {
      next[id] = entry;
    }
  }
  next[userId] = { date, scores };
  return next;
}

export function migrateDailyCheckin(persisted: unknown): { entries: DailyCheckinEntries } {
  if (!isPersistedEntries(persisted)) {
    return { entries: {} };
  }
  return { entries: persisted.entries };
}

function isPersistedEntries(persisted: unknown): persisted is { entries: DailyCheckinEntries } {
  if (!persisted || typeof persisted !== 'object' || !('entries' in persisted)) {
    return false;
  }
  const entries = persisted.entries;
  return entries !== null && typeof entries === 'object' && !Array.isArray(entries);
}

export function shouldPromptMorningCheckin(lastPromptDate: null | string, todayKey: string): boolean {
  return lastPromptDate !== todayKey;
}

export function canSubmitMorningCheckin(scores: {
  motivation: null | number;
  recovery: null | number;
  sleep: null | number;
}): boolean {
  return isFivePointScore(scores.sleep) && isFivePointScore(scores.motivation) && isFivePointScore(scores.recovery);
}

export function scaleFiveToTen(value: number): number {
  return value * 2;
}

export function formatMorningCheckinChatNotice(scores: MorningCheckinScores): string {
  return `Check-in diario: Sueño ${scores.sleep}/5, Motivación ${scores.motivation}/5, Recuperación ${scores.recovery}/5.`;
}

function isFivePointScore(value: null | number): value is number {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}
