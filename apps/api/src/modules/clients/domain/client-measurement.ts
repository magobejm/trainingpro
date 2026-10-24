import type { ProgressActor } from './client-progress-photo';

export const MEASUREMENT_HISTORY_LIMIT = 20;

export type MeasurementDraft = {
  heightCm?: number | null;
  hipCm?: number | null;
  waistCm?: number | null;
  weightKg?: number | null;
};

export type ClientMeasurement = {
  clientId: string;
  createdAt: Date;
  heightCm: number | null;
  hipCm: number | null;
  id: string;
  recordedBy: ProgressActor;
  waistCm: number | null;
  weightKg: number | null;
};

type DecimalLike = number | { toNumber: () => number } | null;

export type MeasurementRow = {
  clientId: string;
  createdAt: Date;
  heightCm: DecimalLike;
  hipCm: DecimalLike;
  id: string;
  recordedBy: string;
  waistCm: DecimalLike;
  weightKg: DecimalLike;
};

const MEASUREMENT_KEYS = ['heightCm', 'hipCm', 'waistCm', 'weightKg'] as const;

export function measurementDraft(input: MeasurementDraft): MeasurementDraft | null {
  const draft: MeasurementDraft = {};
  for (const key of MEASUREMENT_KEYS) {
    if (input[key] !== undefined) draft[key] = input[key];
  }
  return Object.keys(draft).length > 0 ? draft : null;
}

export function clientMeasureColumns(draft: MeasurementDraft): MeasurementDraft {
  return {
    ...(draft.heightCm !== undefined ? { heightCm: roundCm(draft.heightCm) } : {}),
    ...(draft.hipCm !== undefined ? { hipCm: roundCm(draft.hipCm) } : {}),
    ...(draft.waistCm !== undefined ? { waistCm: roundCm(draft.waistCm) } : {}),
    ...(draft.weightKg !== undefined ? { weightKg: draft.weightKg } : {}),
  };
}

export function mapClientMeasurement(row: MeasurementRow): ClientMeasurement {
  return {
    clientId: row.clientId,
    createdAt: row.createdAt,
    heightCm: toNumber(row.heightCm),
    hipCm: toNumber(row.hipCm),
    id: row.id,
    recordedBy: row.recordedBy === 'client' ? 'client' : 'coach',
    waistCm: toNumber(row.waistCm),
    weightKg: toNumber(row.weightKg),
  };
}

function roundCm(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

function toNumber(value: DecimalLike): number | null {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}
