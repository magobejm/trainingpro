export type ComparePhoto = { createdAt: string; imageUrl: string };
export type CompareMark = { measuredAt: string; name: string; value: string };
export type CompareMeasure = {
  bodyFatPct: number | null;
  hipCm: number | null;
  measuredAt: string;
  waistCm: number | null;
  weightKg: number | null;
};

export type ComparisonRow = {
  after: string;
  before: string;
  delta: string;
  name: string;
};

export type Comparison = {
  leftPhoto: ComparePhoto | null;
  rightPhoto: ComparePhoto | null;
  rows: ComparisonRow[];
};

export type SeriesPoint = { day: string; value: number };

const MEASURE_FIELDS = [
  { key: 'weightKg', unit: 'kg' },
  { key: 'waistCm', unit: 'cm' },
  { key: 'hipCm', unit: 'cm' },
  { key: 'bodyFatPct', unit: '%' },
] as const;

export type MeasureKey = (typeof MEASURE_FIELDS)[number]['key'];

export function comparisonDates(photos: ComparePhoto[], marks: CompareMark[], measures: CompareMeasure[] = []): string[] {
  const dates = new Set<string>();
  for (const photo of photos) dates.add(photo.createdAt.slice(0, 10));
  for (const mark of marks) dates.add(mark.measuredAt.slice(0, 10));
  for (const measure of measures) dates.add(measure.measuredAt.slice(0, 10));
  return [...dates].sort();
}

export function buildComparison(
  photos: ComparePhoto[],
  marks: CompareMark[],
  leftDate: string,
  rightDate: string,
): Comparison {
  const names = [...new Set(marks.map((mark) => mark.name))].sort();
  return {
    leftPhoto: photoOnOrBefore(photos, leftDate),
    rightPhoto: photoOnOrBefore(photos, rightDate),
    rows: names.map((name) => rowFor(name, marks, leftDate, rightDate)),
  };
}

export function buildMeasureComparison(measures: CompareMeasure[], leftDate: string, rightDate: string): ComparisonRow[] {
  return MEASURE_FIELDS.flatMap((field) => measureRow(measures, field, leftDate, rightDate));
}

export function measureEvolution(
  measures: CompareMeasure[],
  key: MeasureKey,
  leftDate: string,
  rightDate: string,
): SeriesPoint[] {
  const [start, end] = ordered(leftDate, rightDate);
  const byDay = new Map<string, { at: string; value: number }>();
  for (const measure of measures) rememberMeasure(byDay, measure, key, start, end);
  return pointsOf(byDay);
}

export function markEvolution(marks: CompareMark[], name: string, leftDate: string, rightDate: string): SeriesPoint[] {
  const [start, end] = ordered(leftDate, rightDate);
  const byDay = new Map<string, { at: string; value: number }>();
  for (const mark of marks) rememberMark(byDay, mark, name, start, end);
  return pointsOf(byDay);
}

function measureRow(
  measures: CompareMeasure[],
  field: (typeof MEASURE_FIELDS)[number],
  leftDate: string,
  rightDate: string,
): ComparisonRow[] {
  const before = latestMeasure(measures, field.key, leftDate);
  const after = latestMeasure(measures, field.key, rightDate);
  if (before == null && after == null) return [];
  return [
    {
      after: formatMeasure(after, field.unit),
      before: formatMeasure(before, field.unit),
      delta: measureDelta(before, after, field.unit),
      name: field.key,
    },
  ];
}

function photoOnOrBefore(photos: ComparePhoto[], date: string): ComparePhoto | null {
  const eligible = photos.filter((photo) => photo.createdAt.slice(0, 10) <= date);
  eligible.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return eligible[0] ?? null;
}

function rowFor(name: string, marks: CompareMark[], leftDate: string, rightDate: string): ComparisonRow {
  const before = latestMark(marks, name, leftDate);
  const after = latestMark(marks, name, rightDate);
  return { after: after ?? '—', before: before ?? '—', delta: delta(before, after), name };
}

function latestMark(marks: CompareMark[], name: string, date: string): string | null {
  const eligible = marks.filter((mark) => mark.name === name && mark.measuredAt.slice(0, 10) <= date);
  eligible.sort((left, right) => right.measuredAt.localeCompare(left.measuredAt));
  return eligible[0]?.value ?? null;
}

function latestMeasure(measures: CompareMeasure[], key: MeasureKey, date: string): number | null {
  const eligible = measures.filter((measure) => measure.measuredAt.slice(0, 10) <= date && measure[key] != null);
  eligible.sort((left, right) => right.measuredAt.localeCompare(left.measuredAt));
  return eligible[0]?.[key] ?? null;
}

function formatMeasure(value: number | null, unit: string): string {
  return value == null ? '—' : `${value} ${unit}`;
}

function measureDelta(before: number | null, after: number | null, unit: string): string {
  if (before == null || after == null) return '—';
  return `${signed(after - before)} ${unit}`;
}

function delta(before: string | null, after: string | null): string {
  const left = readAmount(before);
  const right = readAmount(after);
  if (!left || !right) return '—';
  const unit = left.unit && left.unit === right.unit ? ` ${left.unit}` : '';
  return `${signed(right.value - left.value)}${unit}`;
}

function signed(change: number): string {
  const rounded = Math.round(change * 10) / 10;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function ordered(leftDate: string, rightDate: string): [string, string] {
  return leftDate <= rightDate ? [leftDate, rightDate] : [rightDate, leftDate];
}

function rememberMeasure(
  byDay: Map<string, { at: string; value: number }>,
  measure: CompareMeasure,
  key: MeasureKey,
  start: string,
  end: string,
): void {
  const day = measure.measuredAt.slice(0, 10);
  const value = measure[key];
  if (value == null || day < start || day > end) return;
  const current = byDay.get(day);
  if (!current || measure.measuredAt > current.at) byDay.set(day, { at: measure.measuredAt, value });
}

function rememberMark(
  byDay: Map<string, { at: string; value: number }>,
  mark: CompareMark,
  name: string,
  start: string,
  end: string,
): void {
  const day = mark.measuredAt.slice(0, 10);
  const amount = readAmount(mark.value);
  if (mark.name !== name || !amount || day < start || day > end) return;
  const current = byDay.get(day);
  if (!current || mark.measuredAt > current.at) byDay.set(day, { at: mark.measuredAt, value: amount.value });
}

function pointsOf(byDay: Map<string, { at: string; value: number }>): SeriesPoint[] {
  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, item]) => ({ day, value: item.value }));
}

function readAmount(value: string | null): { unit: string; value: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  const leading = trimmed.match(/^([+-]?\d+(?:[.,]\d+)?)(?:\s+(.*))?$/);
  if (leading) return amountOf(leading[1], leading[2]);
  const embedded = trimmed.match(/([+-]?\d+(?:[.,]\d+)?)/);
  return embedded ? amountOf(embedded[1], '') : null;
}

function amountOf(raw: string | undefined, unit: string | undefined): { unit: string; value: number } | null {
  const amount = Number(raw?.replace(',', '.'));
  if (!Number.isFinite(amount)) return null;
  return { unit: unit?.trim() ?? '', value: amount };
}
