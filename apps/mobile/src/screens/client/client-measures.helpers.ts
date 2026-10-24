import type { ClientProgressPhoto, ProgressPose } from '../../data/hooks/useClientMeQuery';

export type { ProgressPose };
export const PROGRESS_POSES: ProgressPose[] = ['front', 'side', 'back'];

export type MeasurementKey = 'heightCm' | 'hipCm' | 'waistCm' | 'weightKg';

export type MeasurementEntry = {
  heightCm: number | null;
  hipCm: number | null;
  waistCm: number | null;
  weightKg: number | null;
};

const RANGES: Record<MeasurementKey, [number, number]> = {
  heightCm: [80, 260],
  hipCm: [40, 220],
  waistCm: [40, 220],
  weightKg: [20, 400],
};

export function groupPhotosByPose(photos: ClientProgressPhoto[]): Record<ProgressPose | 'other', ClientProgressPhoto[]> {
  const groups: Record<ProgressPose | 'other', ClientProgressPhoto[]> = { back: [], front: [], other: [], side: [] };
  for (const photo of photos) {
    const pose = photo.pose;
    if (pose === 'front' || pose === 'side' || pose === 'back') groups[pose].push(photo);
    else groups.other.push(photo);
  }
  return groups;
}

export function parseDecimalInput(raw: string): number | undefined {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

type MeasurementForm = { body: Partial<Record<MeasurementKey, number>> } | { error: 'empty' | 'invalid' };

export function readMeasurementForm(values: Record<MeasurementKey, string>): MeasurementForm {
  const body: Partial<Record<MeasurementKey, number>> = {};
  for (const key of Object.keys(RANGES) as MeasurementKey[]) {
    const raw = values[key].trim();
    if (!raw) continue;
    const value = parseDecimalInput(raw);
    const [min, max] = RANGES[key];
    if (value === undefined || value < min || value > max) return { error: 'invalid' };
    body[key] = value;
  }
  return Object.keys(body).length > 0 ? { body } : { error: 'empty' };
}

export function previousMeasure(entries: MeasurementEntry[], index: number, key: MeasurementKey): number | null {
  for (let cursor = index + 1; cursor < entries.length; cursor += 1) {
    const value = entries[cursor]?.[key];
    if (typeof value === 'number') return value;
  }
  return null;
}

export function formatDelta(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null) return null;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return '0';
  return delta > 0 ? `+${String(delta)}` : String(delta);
}

export function computeBmi(heightCm: null | number, weightKg: null | number): null | number {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  return Math.round((Number(weightKg) / (heightM * heightM)) * 10) / 10;
}

export function filterActivePhotos(photos: ClientProgressPhoto[]): ClientProgressPhoto[] {
  return photos.filter((p) => !p.archived);
}

export function formatMetric(value: null | number | string, unit: string): string {
  if (value === null || value === undefined || value === '') return '–';
  return unit ? `${String(value)} ${unit}` : String(value);
}

export function hasAnyMeasure(client: {
  fcMax: null | number;
  fcRest: null | number;
  heightCm: null | number;
  hipCm: null | number;
  sex: null | string;
  waistCm: null | number;
  weightKg: null | number;
}): boolean {
  return (
    client.heightCm !== null ||
    client.weightKg !== null ||
    client.waistCm !== null ||
    client.hipCm !== null ||
    client.sex !== null ||
    client.fcMax !== null ||
    client.fcRest !== null
  );
}
