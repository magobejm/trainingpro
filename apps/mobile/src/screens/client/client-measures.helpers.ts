import type { ClientProgressPhoto } from '../../data/hooks/useClientMeQuery';

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
