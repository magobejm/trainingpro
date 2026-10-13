export type ComparePhoto = { createdAt: string; imageUrl: string };
export type CompareMark = { measuredAt: string; name: string; value: string };

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

export function comparisonDates(photos: ComparePhoto[], marks: CompareMark[]): string[] {
  const dates = new Set<string>();
  for (const photo of photos) dates.add(photo.createdAt.slice(0, 10));
  for (const mark of marks) dates.add(mark.measuredAt.slice(0, 10));
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

function delta(before: string | null, after: string | null): string {
  const left = Number(before);
  const right = Number(after);
  if (!before || !after || !Number.isFinite(left) || !Number.isFinite(right)) return '—';
  const change = Math.round((right - left) * 10) / 10;
  return change > 0 ? `+${change}` : String(change);
}
