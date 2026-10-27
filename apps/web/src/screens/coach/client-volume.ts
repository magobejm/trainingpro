/** Fixed window of the client volume screen: today and the 28 days before it. */
export function fourWeekRange(today: Date): { from: string; to: string } {
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - 28);
  return { from: isoDay(from), to: isoDay(to) };
}

export type VolumeTotals = { cardioMinutes: number; sets: number; tonnageKg: number };

type StrengthPoint = { muscleGroup: string; totalSets: number; volumeKg: null | number };
type CardioPoint = { methodType: string; totalDurationSeconds: null | number };

export type VolumeOverview = { cardioWeekly: CardioPoint[]; strengthWeekly: StrengthPoint[] };

/** Sets, tonnage and cardio of the window. Null when the window has none of the three. */
export function volumeTotals(overview: VolumeOverview | null): VolumeTotals | null {
  if (!overview) return null;
  const sets = overview.strengthWeekly.reduce((sum, point) => sum + point.totalSets, 0);
  const tonnageKg = Math.round(sumOf(overview.strengthWeekly, (point) => point.volumeKg ?? 0));
  const cardioMinutes = Math.round(sumOf(overview.cardioWeekly, (point) => (point.totalDurationSeconds ?? 0) / 60));
  if (sets === 0 && tonnageKg === 0 && cardioMinutes === 0) return null;
  return { cardioMinutes, sets, tonnageKg };
}

type Translate = (key: string, params?: Record<string, number | string>) => string;

/** Row subtitle: sets and tonnage, or the cardio minutes when that is the only activity. */
export function volumeSubtitle(totals: VolumeTotals | null, t: Translate): null | string {
  if (!totals) return null;
  if (totals.sets === 0 && totals.tonnageKg === 0) return t('coach.volume.cardioOnly', { minutes: totals.cardioMinutes });
  return t('coach.volume.subtitle', { kg: totals.tonnageKg, sets: totals.sets });
}

export type VolumeBar = { id: string; label: string; value: number };

/** One bar per muscle group, summing the tonnage of the window. */
export function muscleBars(points: StrengthPoint[]): VolumeBar[] {
  return ranked(
    points,
    (point) => point.muscleGroup,
    (point) => point.volumeKg ?? 0,
  );
}

/** One bar per cardio method, in minutes. */
export function cardioBars(points: CardioPoint[]): VolumeBar[] {
  return ranked(
    points,
    (point) => point.methodType,
    (point) => (point.totalDurationSeconds ?? 0) / 60,
  );
}

function ranked<T>(points: T[], labelOf: (point: T) => string, valueOf: (point: T) => number): VolumeBar[] {
  const totals = new Map<string, number>();
  for (const point of points) {
    const value = valueOf(point);
    if (value <= 0) continue;
    const label = labelOf(point);
    totals.set(label, (totals.get(label) ?? 0) + value);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ id: label, label, value: Math.round(value) }))
    .sort((left, right) => right.value - left.value);
}

function sumOf<T>(points: T[], valueOf: (point: T) => number): number {
  return points.reduce((sum, point) => sum + valueOf(point), 0);
}

function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
