import type { Prisma } from '@prisma/client';
import { parseMetaNotes } from '../notes/parse-meta-notes';
import type { ClientRoutineExercise, ClientRoutineSet } from '../../modules/clients/domain/client-routine';

export type PlanSetRow = {
  advancedTechnique?: null | string;
  durationSeconds?: null | number;
  fcMaxPct?: null | number;
  fcReservePct?: null | number;
  heartRate?: null | number;
  note?: null | string;
  reps?: null | number;
  restSeconds?: null | number;
  rir?: null | number;
  rom?: null | string;
  rpe?: Prisma.Decimal | null | number | string;
  setIndex: number;
  weightKg?: Prisma.Decimal | null | number | string;
};

export type RoutineBlockPrescription = {
  notes?: null | string;
  perSetWeightRangesJson?: unknown;
  repsMax?: null | number;
  repsMin?: null | number;
  restSeconds?: null | number;
  setsPlanned?: null | number;
  targetRir?: null | number;
  targetRpe?: null | number;
  weightRangeMaxKg?: Prisma.Decimal | null | number | string;
  weightRangeMinKg?: Prisma.Decimal | null | number | string;
};

function mapDecimal(value: PlanSetRow['rpe']): null | number {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return null;
}

function mapSetBase(set: PlanSetRow): ClientRoutineSet {
  return {
    advancedTechnique: set.advancedTechnique ?? null,
    note: set.note ?? null,
    setIndex: set.setIndex,
  };
}

function mapSetMetrics(set: PlanSetRow, type: ClientRoutineExercise['type']): ClientRoutineSet {
  const base = mapSetBase(set);
  switch (type) {
    case 'cardio':
      return {
        ...base,
        fcMaxPct: set.fcMaxPct ?? null,
        fcReservePct: set.fcReservePct ?? null,
        heartRate: set.heartRate ?? null,
        rpe: mapDecimal(set.rpe),
      };
    case 'isometric':
      return {
        ...base,
        durationSeconds: set.durationSeconds ?? null,
        restSeconds: set.restSeconds ?? null,
        rpe: mapDecimal(set.rpe),
        weightKg: mapDecimal(set.weightKg),
      };
    case 'mobility':
      return {
        ...base,
        reps: set.reps ?? null,
        restSeconds: set.restSeconds ?? null,
        rom: set.rom ?? null,
        rpe: mapDecimal(set.rpe),
      };
    case 'plio':
      return {
        ...base,
        reps: set.reps ?? null,
        restSeconds: set.restSeconds ?? null,
        rpe: mapDecimal(set.rpe),
        weightKg: mapDecimal(set.weightKg),
      };
    case 'sport':
      return {
        ...base,
        fcMaxPct: set.fcMaxPct ?? null,
        fcReservePct: set.fcReservePct ?? null,
        heartRate: set.heartRate ?? null,
        reps: set.reps ?? null,
        restSeconds: set.restSeconds ?? null,
        rir: set.rir ?? null,
        rpe: mapDecimal(set.rpe),
        weightKg: mapDecimal(set.weightKg),
      };
    default:
      return {
        ...base,
        reps: set.reps ?? null,
        restSeconds: set.restSeconds ?? null,
        rir: set.rir ?? null,
        rpe: mapDecimal(set.rpe),
        weightKg: mapDecimal(set.weightKg),
      };
  }
}

function normalizePlanSetRows(sets: PlanSetRow[] | undefined, setsPlanned?: null | number): PlanSetRow[] {
  const sorted = (sets ?? []).slice().sort((a, b) => a.setIndex - b.setIndex);
  if (sorted.length > 0) return sorted;
  const count = setsPlanned ?? 0;
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, setIndex) => ({ setIndex }));
}

function parseCsvNumbers(value: unknown): number[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
}

function readMetaNumber(meta: Record<string, unknown>, key: string): null | number {
  const value = meta[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readPerSetWeightRanges(json: unknown): Array<null | number> {
  if (!Array.isArray(json)) return [];
  return json.map((entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const maxKg = (entry as { maxKg?: unknown }).maxKg;
    const minKg = (entry as { minKg?: unknown }).minKg;
    if (typeof maxKg === 'number' && Number.isFinite(maxKg)) return maxKg;
    if (typeof minKg === 'number' && Number.isFinite(minKg)) return minKg;
    return null;
  });
}

function fallbackReps(
  setIndex: number,
  meta: Record<string, unknown>,
  prescription?: RoutineBlockPrescription,
): null | number {
  const perSet = parseCsvNumbers(meta.repsPorSerie);
  if (perSet[setIndex] != null) return perSet[setIndex]!;
  const perSetMeta = parseCsvNumbers(
    typeof meta.repeticiones === 'string' ? meta.repeticiones : String(meta.repeticiones ?? ''),
  );
  if (perSetMeta[setIndex] != null) return perSetMeta[setIndex]!;
  const singleMeta = readMetaNumber(meta, 'repeticiones');
  if (singleMeta != null) return singleMeta;
  if (prescription?.repsMin != null && prescription.repsMax != null) {
    if (prescription.repsMin === prescription.repsMax) return prescription.repsMin;
    return prescription.repsMax;
  }
  return prescription?.repsMax ?? prescription?.repsMin ?? null;
}

function enrichSet(
  set: ClientRoutineSet,
  type: ClientRoutineExercise['type'],
  meta: Record<string, unknown>,
  prescription?: RoutineBlockPrescription,
): ClientRoutineSet {
  const perSetWeights = readPerSetWeightRanges(prescription?.perSetWeightRangesJson);
  const blockWeight =
    mapDecimal(prescription?.weightRangeMaxKg) ??
    mapDecimal(prescription?.weightRangeMinKg) ??
    readMetaNumber(meta, 'pesoKg');
  const blockRest = prescription?.restSeconds ?? null;
  const blockRir = prescription?.targetRir ?? null;
  const blockRpe = prescription?.targetRpe ?? null;

  switch (type) {
    case 'cardio':
      return {
        ...set,
        fcMaxPct: set.fcMaxPct ?? readMetaNumber(meta, 'intensidadFcMax'),
        fcReservePct: set.fcReservePct ?? readMetaNumber(meta, 'intensidadFcReserva'),
        heartRate: set.heartRate ?? readMetaNumber(meta, 'pulsaciones'),
        rpe: set.rpe ?? blockRpe,
      };
    case 'isometric':
      return {
        ...set,
        restSeconds: set.restSeconds ?? blockRest,
        rpe: set.rpe ?? blockRpe,
        weightKg: set.weightKg ?? blockWeight,
      };
    case 'mobility':
    case 'plio':
      return {
        ...set,
        reps: set.reps ?? fallbackReps(set.setIndex, meta, prescription),
        restSeconds: set.restSeconds ?? blockRest,
        rpe: set.rpe ?? blockRpe,
        weightKg: type === 'plio' ? (set.weightKg ?? blockWeight) : set.weightKg,
      };
    case 'sport':
      return {
        ...set,
        fcMaxPct: set.fcMaxPct ?? readMetaNumber(meta, 'intensidadFcMax'),
        fcReservePct: set.fcReservePct ?? readMetaNumber(meta, 'intensidadFcReserva'),
        heartRate: set.heartRate ?? readMetaNumber(meta, 'pulsaciones'),
        reps: set.reps ?? fallbackReps(set.setIndex, meta, prescription),
        restSeconds: set.restSeconds ?? blockRest,
        rir: set.rir ?? blockRir,
        rpe: set.rpe ?? blockRpe,
        weightKg: set.weightKg ?? perSetWeights[set.setIndex] ?? blockWeight,
      };
    default:
      return {
        ...set,
        reps: set.reps ?? fallbackReps(set.setIndex, meta, prescription),
        restSeconds: set.restSeconds ?? blockRest,
        rir: set.rir ?? blockRir,
        rpe: set.rpe ?? blockRpe,
        weightKg: set.weightKg ?? perSetWeights[set.setIndex] ?? blockWeight,
      };
  }
}

export function resolveClientRoutineSets(
  sets: PlanSetRow[] | undefined,
  type: ClientRoutineExercise['type'],
  prescription?: RoutineBlockPrescription,
): ClientRoutineSet[] {
  const meta = parseMetaNotes(prescription?.notes).meta;
  const normalizedSets = normalizePlanSetRows(sets, prescription?.setsPlanned);
  return normalizedSets.map((set) => mapSetMetrics(set, type)).map((set) => enrichSet(set, type, meta, prescription));
}

/** @deprecated Use resolveClientRoutineSets */
export function mapPlanSetsToClientRoutineSets(
  sets: PlanSetRow[] | undefined,
  type: ClientRoutineExercise['type'],
): ClientRoutineSet[] {
  return resolveClientRoutineSets(sets, type);
}
