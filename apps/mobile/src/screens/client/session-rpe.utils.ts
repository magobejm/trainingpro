export const DEFAULT_SESSION_RPE = 7.5;
export const SESSION_RPE_STEP = 0.5;
export const SESSION_RPE_MIN = 1;
export const SESSION_RPE_MAX = 10;

export const SESSION_RPE_STEPS: number[] = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export type SessionRpeBandKey = 'easy' | 'extremelyHard' | 'hard' | 'max' | 'moderate' | 'veryEasy' | 'veryHard';

export type SessionRpeBand = {
  bg: string;
  border: string;
  key: SessionRpeBandKey;
  text: string;
};

export function clampSessionRpe(value: number): number {
  const snapped = Math.round(value / SESSION_RPE_STEP) * SESSION_RPE_STEP;
  const clamped = Math.min(SESSION_RPE_MAX, Math.max(SESSION_RPE_MIN, snapped));
  return Number(clamped.toFixed(1));
}

export function formatSessionRpe(value: number): string {
  const rpe = clampSessionRpe(value);
  return Number.isInteger(rpe) ? String(rpe) : rpe.toFixed(1);
}

export function sessionRpeBand(value: number): SessionRpeBand {
  const rpe = clampSessionRpe(value);
  if (rpe <= 2) return { key: 'veryEasy', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' };
  if (rpe <= 3.5) return { key: 'easy', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };
  if (rpe <= 5.5) return { key: 'moderate', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
  if (rpe <= 7) return { key: 'hard', bg: '#fffbeb', border: '#fde68a', text: '#b45309' };
  if (rpe <= 8.5) return { key: 'veryHard', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' };
  if (rpe <= 9.5) return { key: 'extremelyHard', bg: '#fff1f2', border: '#fecdd3', text: '#be123c' };
  return { key: 'max', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
}

export function finishSessionWithRpePayload(value: number): {
  comment: null;
  isIncomplete: false;
  postFatigue: null;
  postMood: null;
  postPain: null;
  sessionRpe: number;
} {
  return {
    comment: null,
    isIncomplete: false,
    postFatigue: null,
    postMood: null,
    postPain: null,
    sessionRpe: clampSessionRpe(value),
  };
}

export function formatSessionRpeChatNotice(value: number, label: string): string {
  return `RPE de la sesión registrado: ${formatSessionRpe(value)}/10 (${label}).`;
}
