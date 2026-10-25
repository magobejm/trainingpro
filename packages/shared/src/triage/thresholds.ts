export const HIGH_FATIGUE_AT = 4;
export const HIGH_PAIN_AT = 4;
export const RISK_INACTIVE_DAYS = 3;
export const RISK_ADHERENCE = 0.5;
export const MIN_CLIENTS_FOR_COACH_METRICS = 3;

export function fatigueFromSleep(sleep: number): number {
  return Math.min(5, Math.max(1, 6 - sleep));
}

export function isHighMorningCheckin(input: { fatigue: number; pain: number | null }): boolean {
  return input.fatigue >= HIGH_FATIGUE_AT || (input.pain != null && input.pain >= HIGH_PAIN_AT);
}

export function isRiskClient(input: { adherence: number | null; inactiveDays: number | null }): boolean {
  if (input.inactiveDays == null || input.inactiveDays > RISK_INACTIVE_DAYS) return true;
  return input.adherence != null && input.adherence < RISK_ADHERENCE;
}
