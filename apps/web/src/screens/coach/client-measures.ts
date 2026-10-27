export type MeasureSource = {
  bodyFatPct?: number | null;
  createdAt: string;
  fcMax?: number | null;
  fcRest?: number | null;
  heightCm: number | null;
  hipCm: number | null;
  measuredAt?: string;
  recordedBy: 'client' | 'coach';
  skinfoldsJson?: Record<string, number> | null;
  waistCm: number | null;
  weightKg: number | null;
};

export type MeasurePoint = { at: string; value: number };

export type MeasureSeries = { key: string; points: MeasurePoint[] };

export type MeasureRecord = {
  at: string;
  recordedBy: 'client' | 'coach';
  values: { key: string; value: number }[];
};

export type MeasurePhoto = { createdAt: string; id: string; imageUrl: string };

const FIELDS = ['weightKg', 'waistCm', 'hipCm', 'heightCm', 'bodyFatPct', 'fcRest', 'fcMax'] as const;

/** One line per series that was written on at least two different days. */
export function measureSeries(items: MeasureSource[]): MeasureSeries[] {
  const fixed = FIELDS.map((key) => seriesOf(key, items, (item) => readNumber(item[key])));
  const folds = foldNames(items).map((key) => seriesOf(key, items, (item) => readNumber(item.skinfoldsJson?.[key])));
  return [...fixed, ...folds].filter((item) => item.points.length >= 2);
}

/** Newest record first, with only the numbers written that day. */
export function measureRecords(items: MeasureSource[]): MeasureRecord[] {
  return [...items]
    .sort((left, right) => stamp(right) - stamp(left))
    .map((item) => ({
      at: item.measuredAt ?? item.createdAt,
      recordedBy: item.recordedBy,
      values: valuesOf(item),
    }));
}

/** Inclusive window ending today and starting the same calendar day one year earlier. */
export function defaultMeasureRange(today = new Date()): { from: string; to: string } {
  return { from: isoDay(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())), to: isoDay(today) };
}

/** Keeps photos and records whose day falls inside the chosen window. An inverted pair is swapped. */
export function inMeasureRange(iso: string, from: string, to: string): boolean {
  const day = iso.slice(0, 10);
  const start = from && to && from > to ? to : from;
  const end = from && to && from > to ? from : to;
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

/** Progress photos that are still visible, newest first. */
export function readMeasurePhotos(photos: (MeasurePhoto & { archived: boolean })[]): MeasurePhoto[] {
  return photos
    .filter((photo) => !photo.archived && photo.imageUrl.length > 0)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((photo) => ({ createdAt: photo.createdAt, id: photo.id, imageUrl: photo.imageUrl }));
}

export function formatMeasureDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

function seriesOf(key: string, items: MeasureSource[], read: (item: MeasureSource) => number | null): MeasureSeries {
  const byDay = new Map<string, { stamp: number; value: number }>();
  for (const item of items) {
    const value = read(item);
    if (value === null) continue;
    const at = (item.measuredAt ?? item.createdAt).slice(0, 10);
    const time = stamp(item);
    const current = byDay.get(at);
    if (!current || time >= current.stamp) byDay.set(at, { stamp: time, value });
  }
  const points = [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([at, point]) => ({ at, value: point.value }));
  return { key, points };
}

function valuesOf(item: MeasureSource): { key: string; value: number }[] {
  const fixed = FIELDS.flatMap((key) => {
    const value = readNumber(item[key]);
    return value === null ? [] : [{ key, value }];
  });
  const folds = Object.entries(item.skinfoldsJson ?? {}).flatMap(([key, value]) =>
    readNumber(value) === null ? [] : [{ key, value }],
  );
  return [...fixed, ...folds];
}

function foldNames(items: MeasureSource[]): string[] {
  const names = new Set<string>();
  for (const item of items) Object.keys(item.skinfoldsJson ?? {}).forEach((key) => names.add(key));
  return [...names].sort((left, right) => left.localeCompare(right));
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stamp(item: MeasureSource): number {
  const time = Date.parse(item.measuredAt ?? item.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
