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

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
