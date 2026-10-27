import type { ProgressActor } from './client-progress-photo';

export const MEASUREMENT_HISTORY_LIMIT = 20;

export type MeasurementDraft = {
  heightCm?: number | null;
  hipCm?: number | null;
  waistCm?: number | null;
  weightKg?: number | null;
};

export type ClientMeasurement = {
  bodyFatPct: number | null;
  clientId: string;
  createdAt: Date;
  fcMax: number | null;
  fcRest: number | null;
  heightCm: number | null;
  hipCm: number | null;
  id: string;
  measuredAt: Date;
  notes: string | null;
  recordedBy: ProgressActor;
  skinfoldsJson: Record<string, number> | null;
  waistCm: number | null;
  weightKg: number | null;
};

type DecimalLike = number | { toNumber: () => number } | null;

export type MeasurementRow = {
  bodyFatPct?: DecimalLike;
  clientId: string;
  createdAt: Date;
  fcMax?: number | null;
  fcRest?: number | null;
  heightCm: DecimalLike;
  hipCm: DecimalLike;
  id: string;
  measuredAt?: Date;
  notes?: string | null;
  recordedBy: string;
  skinfoldsJson?: unknown;
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
    bodyFatPct: toNumber(row.bodyFatPct ?? null),
    clientId: row.clientId,
    createdAt: row.createdAt,
    fcMax: row.fcMax ?? null,
    fcRest: row.fcRest ?? null,
    heightCm: toNumber(row.heightCm),
    hipCm: toNumber(row.hipCm),
    id: row.id,
    measuredAt: row.measuredAt ?? row.createdAt,
    notes: row.notes ?? null,
    recordedBy: row.recordedBy === 'client' ? 'client' : 'coach',
    skinfoldsJson: readSkinfolds(row.skinfoldsJson),
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

function readSkinfolds(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const folds: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && Number.isFinite(item)) folds[key] = item;
  }
  return Object.keys(folds).length > 0 ? folds : null;
}
