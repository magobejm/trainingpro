export const WEARABLE_SOURCES = ['GARMIN', 'POLAR', 'STRAVA', 'HEALTH_CONNECT', 'HEALTHKIT'] as const;
export type WearableSource = (typeof WEARABLE_SOURCES)[number];

const RANK: Record<WearableSource, number> = {
  GARMIN: 4,
  HEALTH_CONNECT: 2,
  HEALTHKIT: 2,
  POLAR: 3,
  STRAVA: 0,
};

export type DailyMetricFields = {
  activeKcal?: number | null;
  bodyBattery?: number | null;
  hrvMs?: number | null;
  restingHr?: number | null;
  sleepMinutes?: number | null;
  sleepScore?: number | null;
  source: WearableSource;
  steps?: number | null;
  weightKg?: number | null;
};

type MetricField =
  | 'activeKcal'
  | 'bodyBattery'
  | 'hrvMs'
  | 'restingHr'
  | 'sleepMinutes'
  | 'sleepScore'
  | 'steps'
  | 'weightKg';

export function assertAiAllowedSource(source: string): void {
  if (source === 'STRAVA') throw new Error('Strava data cannot be sent to AI');
}

export function visibleToCoach(source: WearableSource): boolean {
  return source !== 'STRAVA';
}

export type MergedDaily = {
  activeKcal: number | null;
  bodyBattery: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
  sleepScore: number | null;
  sources: WearableSource[];
  steps: number | null;
  weightKg: number | null;
};

export function mergeDailyMetrics(rows: DailyMetricFields[]): MergedDaily {
  const ranked = [...rows].sort((left, right) => RANK[right.source] - RANK[left.source]);
  const pick = (field: MetricField): number | null => {
    const winner = ranked.find((row) => row[field] != null && visibleToCoach(row.source));
    const value = winner?.[field];
    return typeof value === 'number' ? value : null;
  };
  return {
    activeKcal: pick('activeKcal'),
    bodyBattery: pick('bodyBattery'),
    hrvMs: pick('hrvMs'),
    restingHr: pick('restingHr'),
    sleepMinutes: pick('sleepMinutes'),
    sleepScore: pick('sleepScore'),
    sources: ranked.filter((row) => visibleToCoach(row.source)).map((row) => row.source),
    steps: pick('steps'),
    weightKg: pick('weightKg'),
  };
}

export function activitiesOverlap(left: { startAt: string }, right: { startAt: string }, windowMs = 120_000): boolean {
  return Math.abs(new Date(left.startAt).getTime() - new Date(right.startAt).getTime()) <= windowMs;
}
