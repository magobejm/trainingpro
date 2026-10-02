import type {
  LogIntervalMutationInput,
  LogIsometricSetMutationInput,
  LogMobilitySetMutationInput,
  LogPlioSetMutationInput,
  LogSetMutationInput,
  LogSportMutationInput,
  PlannedSet,
  SessionItem,
  StrengthSessionItem,
} from '../../data/hooks/useTodaySession';
import { filterActiveSetColumns, isFieldLocked, isRestFieldLocked } from '../../utils/locked-fields.utils';
import { toYouTubeEmbedUrl } from '../../utils/library-media.helpers';
import { resolvePlannedSet } from './planned-set.utils';
import { resolveLockedFields, setVariablesForType, type SetVariableKey } from '@trainerpro/shared';
import { exerciseTypeShowsRepRange, formatRepRangeBounds } from './routine-exercise-set.utils';
import { formatRestLabel } from './session-completion.utils';

export type SetFieldKey =
  | 'duration'
  | 'distance'
  | 'fcMaxPct'
  | 'fcReservePct'
  | 'heartRate'
  | 'reps'
  | 'rest'
  | 'rir'
  | 'rpe'
  | 'rom'
  | 'weight';

export type SetColumn = {
  key: SetFieldKey;
  label: string;
  scale?: 'none' | 'rpe' | 'rir' | 'rom';
};

export type SetRowState = Record<SetFieldKey, string>;

export function getSetCount(item: SessionItem): number {
  switch (item.type) {
    case 'strength':
    case 'isometric':
      return item.setsPlanned ?? 1;
    case 'cardio':
    case 'plio':
    case 'mobility':
      return item.roundsPlanned;
    case 'sport':
      return item.plannedSets.length || 1;
    default:
      return 1;
  }
}

export function formatSessionRepRange(item: SessionItem): null | string {
  if (!exerciseTypeShowsRepRange(item.type)) return null;
  if (item.type === 'strength') return formatRepRangeBounds(item.repsMin, item.repsMax);
  const reps = item.plannedSets.map((set) => set.reps).filter((value): value is number => value != null);
  if (reps.length === 0) return null;
  return formatRepRangeBounds(Math.min(...reps), Math.max(...reps));
}

export function getSetColumns(item: SessionItem): SetColumn[] {
  const columns = getBaseSetColumns(item);
  return filterActiveSetColumns(columns, resolveLockedFields(item.type, item.lockedFields));
}

const ACTIVE_COLUMN_BY_KEY: Record<SetVariableKey, SetColumn> = {
  reps: { key: 'reps', label: 'Reps' },
  weightKg: { key: 'weight', label: 'Peso' },
  rpe: { key: 'rpe', label: 'RPE', scale: 'rpe' },
  fcMaxPct: { key: 'fcMaxPct', label: '%FC máx' },
  durationSeconds: { key: 'duration', label: 'Duración' },
  heartRate: { key: 'heartRate', label: 'Pulsaciones' },
  rir: { key: 'rir', label: 'RIR', scale: 'rir' },
  fcReservePct: { key: 'fcReservePct', label: '%FC res' },
  rom: { key: 'rom', label: 'ROM', scale: 'rom' },
  restSeconds: { key: 'rest', label: 'Descanso' },
};

function getBaseSetColumns(item: SessionItem): SetColumn[] {
  return setVariablesForType(item.type).map((key) => ACTIVE_COLUMN_BY_KEY[key]);
}

export function readTargetValue(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const planned = resolvePlannedSet(item.plannedSets, setIndex);
  if (key === 'reps') {
    const fallback = item.type === 'strength' ? (item.repsMax ?? item.repsMin) : null;
    return formatTargetNumber(planned?.reps ?? fallback);
  }
  if (key === 'weight') {
    const fallback = item.type === 'strength' ? (item.weightRangeMaxKg ?? item.weightRangeMinKg) : null;
    const kg = planned?.weightKg ?? fallback;
    return kg != null ? `${kg}kg` : '-';
  }
  if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
  if (key === 'rir') {
    const fallback = item.type === 'strength' ? item.targetRir : null;
    return formatTargetNumber(planned?.rir ?? fallback);
  }
  if (key === 'rom') return planned?.rom?.trim() ? planned.rom : '-';
  if (key === 'heartRate') return formatTargetNumber(planned?.heartRate);
  if (key === 'fcMaxPct') return formatTargetNumber(planned?.fcMaxPct);
  if (key === 'fcReservePct') return formatTargetNumber(planned?.fcReservePct);
  if (key === 'rest') {
    const rest = planned?.restSeconds ?? ('restSeconds' in item ? item.restSeconds : null);
    return formatTargetSeconds(rest);
  }
  if (key === 'duration') {
    if (planned?.durationSeconds != null) return formatTargetSeconds(planned.durationSeconds);
    if (item.type === 'cardio' && item.workSeconds) return `${item.workSeconds}s`;
    if (item.type === 'sport') return `${item.durationMinutes}m`;
    return '-';
  }
  return '-';
}

function formatTargetNumber(value: null | number | undefined): string {
  return value != null ? String(value) : '-';
}

function formatTargetSeconds(value: null | number | undefined): string {
  return value != null && value > 0 ? formatRestLabel(value) : '-';
}

export function readActualValue(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  switch (item.type) {
    case 'strength': {
      const log = item.logs.find((entry) => entry.setIndex === setIndex);
      if (!log) return '';
      if (key === 'reps') return log.repsDone != null ? String(log.repsDone) : '';
      if (key === 'rir') return log.effortRir != null ? String(log.effortRir) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'weight') return log.weightDoneKg != null ? String(log.weightDoneKg) : '';
      return '';
    }
    case 'plio': {
      const log = item.logs.find((entry) => entry.setIndex === setIndex);
      if (!log) return '';
      if (key === 'reps') return log.repsDone != null ? String(log.repsDone) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'weight') return log.weightDoneKg != null ? String(log.weightDoneKg) : '';
      if (key === 'duration') return log.durationSecondsDone != null ? String(log.durationSecondsDone) : '';
      return '';
    }
    case 'mobility': {
      const log = item.logs.find((entry) => entry.setIndex === setIndex);
      if (!log) return '';
      if (key === 'reps') return log.repsDone != null ? String(log.repsDone) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'rom') return log.romDone ?? '';
      if (key === 'weight') return log.weightDoneKg != null ? String(log.weightDoneKg) : '';
      return '';
    }
    case 'isometric': {
      const log = item.logs.find((entry) => entry.setIndex === setIndex);
      if (!log) return '';
      if (key === 'duration') return log.durationSecondsDone != null ? String(log.durationSecondsDone) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'weight') return log.weightDoneKg != null ? String(log.weightDoneKg) : '';
      return '';
    }
    case 'cardio': {
      const log = item.intervalLogs.find((entry) => entry.intervalIndex === setIndex);
      if (!log) return '';
      if (key === 'duration') return log.durationSecondsDone != null ? String(log.durationSecondsDone) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'heartRate') return log.avgHeartRate != null ? String(log.avgHeartRate) : '';
      if (key === 'rest') return log.restSecondsDone != null ? String(log.restSecondsDone) : '';
      return '';
    }
    case 'sport': {
      const log = (item.setLogs ?? []).find((entry) => entry.setIndex === setIndex);
      if (!log) return '';
      if (key === 'reps') return log.repsDone != null ? String(log.repsDone) : '';
      if (key === 'weight') return log.weightDoneKg != null ? String(log.weightDoneKg) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'fcMaxPct') return log.hrMaxPctDone != null ? String(log.hrMaxPctDone) : '';
      if (key === 'duration') return log.durationSecondsDone != null ? String(log.durationSecondsDone) : '';
      if (key === 'heartRate') return log.heartRateDone != null ? String(log.heartRateDone) : '';
      if (key === 'rir') return log.effortRir != null ? String(log.effortRir) : '';
      if (key === 'fcReservePct') return log.hrReservePctDone != null ? String(log.hrReservePctDone) : '';
      if (key === 'rom') return log.romDone ?? '';
      if (key === 'rest') return log.restSecondsDone != null ? String(log.restSecondsDone) : '';
      return '';
    }
    default:
      return '';
  }
}

export function getRestSeconds(item: SessionItem): number {
  if (isRestFieldLocked(resolveLockedFields(item.type, item.lockedFields))) return 0;
  if (item.type === 'strength' || item.type === 'isometric') return item.restSeconds ?? 0;
  if (item.type === 'cardio' || item.type === 'plio' || item.type === 'mobility') return item.restSeconds;
  if (item.type === 'sport') return item.plannedSets[0]?.restSeconds ?? 0;
  return 0;
}

function parseNumber(value: string): null | number {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function lockedOrDraftNumber(
  item: SessionItem,
  setIndex: number,
  webFieldKey: string,
  activeKey: SetFieldKey,
  draftValue: string,
): null | number {
  if (isFieldLocked(item.lockedFields, webFieldKey)) {
    return parseNumber(readActualValue(item, setIndex, activeKey));
  }
  return parseNumber(draftValue);
}

function lockedOrDraftText(
  item: SessionItem,
  setIndex: number,
  webFieldKey: string,
  activeKey: SetFieldKey,
  draftValue: string,
): null | string {
  if (isFieldLocked(item.lockedFields, webFieldKey)) {
    const actual = readActualValue(item, setIndex, activeKey).trim();
    return actual || null;
  }
  const trimmed = draftValue.trim();
  return trimmed || null;
}

export function buildLogPayload(
  item: SessionItem,
  setIndex: number,
  values: SetRowState,
):
  | LogIntervalMutationInput
  | LogIsometricSetMutationInput
  | LogMobilitySetMutationInput
  | LogPlioSetMutationInput
  | LogSetMutationInput
  | LogSportMutationInput
  | null {
  switch (item.type) {
    case 'strength':
      return {
        effortRir: lockedOrDraftNumber(item, setIndex, 'rir', 'rir', values.rir),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        repsDone: lockedOrDraftNumber(item, setIndex, 'reps', 'reps', values.reps),
        sessionItemId: item.id,
        setIndex,
        weightDoneKg: lockedOrDraftNumber(item, setIndex, 'weightKg', 'weight', values.weight),
      };
    case 'plio':
      return {
        durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        repsDone: lockedOrDraftNumber(item, setIndex, 'reps', 'reps', values.reps),
        sessionPlioBlockId: item.id,
        setIndex,
        weightDoneKg: lockedOrDraftNumber(item, setIndex, 'weightKg', 'weight', values.weight),
      };
    case 'mobility':
      return {
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        repsDone: lockedOrDraftNumber(item, setIndex, 'reps', 'reps', values.reps),
        romDone: lockedOrDraftText(item, setIndex, 'rom', 'rom', values.rom),
        sessionMobilityBlockId: item.id,
        setIndex,
        weightDoneKg: lockedOrDraftNumber(item, setIndex, 'weightKg', 'weight', values.weight),
      };
    case 'isometric':
      return {
        durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        sessionIsometricBlockId: item.id,
        setIndex,
        weightDoneKg: lockedOrDraftNumber(item, setIndex, 'weightKg', 'weight', values.weight),
      };
    case 'cardio':
      return {
        avgHeartRate: lockedOrDraftNumber(item, setIndex, 'heartRate', 'heartRate', values.heartRate),
        durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        intervalIndex: setIndex,
        restSecondsDone: lockedOrDraftNumber(item, setIndex, 'restSeconds', 'rest', values.rest),
        sessionCardioBlockId: item.id,
      };
    case 'sport':
      return {
        durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
        effortRir: lockedOrDraftNumber(item, setIndex, 'rir', 'rir', values.rir),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        heartRateDone: lockedOrDraftNumber(item, setIndex, 'heartRate', 'heartRate', values.heartRate),
        hrMaxPctDone: lockedOrDraftNumber(item, setIndex, 'fcMaxPct', 'fcMaxPct', values.fcMaxPct),
        hrReservePctDone: lockedOrDraftNumber(item, setIndex, 'fcReservePct', 'fcReservePct', values.fcReservePct),
        repsDone: lockedOrDraftNumber(item, setIndex, 'reps', 'reps', values.reps),
        restSecondsDone: lockedOrDraftNumber(item, setIndex, 'restSeconds', 'rest', values.rest),
        romDone: lockedOrDraftText(item, setIndex, 'rom', 'rom', values.rom),
        sessionSportBlockId: item.id,
        setIndex,
        weightDoneKg: lockedOrDraftNumber(item, setIndex, 'weightKg', 'weight', values.weight),
      };
    default:
      return null;
  }
}

export function getPlannedSet(item: SessionItem, setIndex: number): PlannedSet | null {
  return item.plannedSets.find((entry) => entry.setIndex === setIndex) ?? null;
}

export function getStrengthSessionItemId(item: SessionItem): null | string {
  return item.type === 'strength' ? item.id : null;
}

export function getSourceExerciseId(item: SessionItem): null | string {
  return item.type === 'strength' ? item.sourceExerciseId : null;
}

export function readSessionYoutubeUrl(item: SessionItem): null | string {
  const url = item.youtubeUrl?.trim();
  if (!url || !toYouTubeEmbedUrl(url)) return null;
  return url;
}

export function draftHasValues(values: SetRowState | undefined): boolean {
  if (!values) {
    return false;
  }
  return Object.values(values).some((value) => value.trim().length > 0);
}

export type { StrengthSessionItem, SessionItem };
