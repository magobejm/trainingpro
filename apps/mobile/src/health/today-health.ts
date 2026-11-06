import type { HealthSnapshot } from './provider';

export type TodayHealthLine = {
  id: 'heart' | 'sleep' | 'steps' | 'weight';
  key: string;
  values: Record<string, number>;
};

/** Fields the client can see from today's Health Connect reading. Missing values stay hidden. */
export function todayHealthLines(snapshot: HealthSnapshot | null): TodayHealthLine[] {
  if (!snapshot) return [];
  const lines: TodayHealthLine[] = [];
  if (snapshot.steps != null)
    lines.push({ id: 'steps', key: 'mobile.client.health.steps', values: { count: snapshot.steps } });
  if (snapshot.sleepHours != null) {
    lines.push({ id: 'sleep', key: 'mobile.client.health.sleepHours', values: { hours: snapshot.sleepHours } });
  }
  if (snapshot.heartRate) {
    lines.push({
      id: 'heart',
      key: 'mobile.client.health.heartRate',
      values: { average: snapshot.heartRate.average, max: snapshot.heartRate.max },
    });
  }
  if (snapshot.weightKg != null)
    lines.push({ id: 'weight', key: 'mobile.client.health.weightKg', values: { kg: snapshot.weightKg } });
  return lines;
}
