type MeasureBit = {
  createdAt: string;
  measuredAt?: string;
  waistCm: number | null;
  weightKg: number | null;
};

type Translate = (key: string, params?: Record<string, number | string>) => string;

/** Latest weight and latest waist. One shared date when both were written the same day. */
export function measuresSubtitle(items: MeasureBit[], t: Translate, formatDate: (iso: string) => string): string | null {
  const weight = latest(items, 'weightKg');
  const waist = latest(items, 'waistCm');
  if (weight && waist && day(weight.at) === day(waist.at)) {
    return [
      t('coach.measures.weightValue', { value: weight.value }),
      t('coach.measures.waistValue', { value: waist.value }),
      formatDate(weight.at),
    ].join(' · ');
  }
  const parts: string[] = [];
  if (weight) parts.push(t('coach.measures.weightOn', { date: formatDate(weight.at), value: weight.value }));
  if (waist) parts.push(t('coach.measures.waistOn', { date: formatDate(waist.at), value: waist.value }));
  return parts.length > 0 ? parts.join(' · ') : null;
}

function latest(items: MeasureBit[], key: 'waistCm' | 'weightKg'): { at: string; value: number } | null {
  const found = [...items].sort((left, right) => stamp(right) - stamp(left)).find((item) => typeof item[key] === 'number');
  const value = found?.[key];
  return found && typeof value === 'number' ? { at: found.measuredAt ?? found.createdAt, value } : null;
}

function day(iso: string): string {
  return iso.slice(0, 10);
}

function stamp(item: MeasureBit): number {
  const time = Date.parse(item.measuredAt ?? item.createdAt);
  return Number.isNaN(time) ? 0 : time;
}
