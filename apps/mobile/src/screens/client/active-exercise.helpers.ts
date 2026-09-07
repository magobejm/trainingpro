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
import { resolvePlannedSet } from './planned-set.utils';

export type SetFieldKey = 'duration' | 'distance' | 'heartRate' | 'reps' | 'rest' | 'rir' | 'rpe' | 'rom' | 'weight';

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
      return 1;
    default:
      return 1;
  }
}

export function getSetColumns(item: SessionItem): SetColumn[] {
  const columns = getBaseSetColumns(item);
  return filterActiveSetColumns(columns, item.lockedFields);
}

function getBaseSetColumns(item: SessionItem): SetColumn[] {
  switch (item.type) {
    case 'strength':
      return [
        { key: 'reps', label: 'Reps' },
        { key: 'rir', label: 'RIR', scale: 'rir' },
        { key: 'rpe', label: 'RPE', scale: 'rpe' },
        { key: 'weight', label: 'Peso' },
      ];
    case 'cardio':
      return [
        { key: 'duration', label: 'Duración' },
        { key: 'distance', label: 'Distancia' },
        { key: 'rpe', label: 'RPE', scale: 'rpe' },
        { key: 'heartRate', label: 'FC' },
      ];
    case 'plio':
      return [
        { key: 'reps', label: 'Reps' },
        { key: 'weight', label: 'Peso' },
        { key: 'rpe', label: 'RPE', scale: 'rpe' },
        { key: 'duration', label: 'Descanso' },
      ];
    case 'mobility':
      return [
        { key: 'reps', label: 'Reps' },
        { key: 'rom', label: 'ROM', scale: 'rom' },
        { key: 'rpe', label: 'RPE', scale: 'rpe' },
        { key: 'duration', label: 'Descanso' },
      ];
    case 'isometric':
      return [
        { key: 'duration', label: 'Duración' },
        { key: 'weight', label: 'Peso' },
        { key: 'rpe', label: 'RPE', scale: 'rpe' },
        { key: 'rest', label: 'Descanso' },
      ];
    case 'sport':
      return [
        { key: 'duration', label: 'Duración' },
        { key: 'rpe', label: 'RPE', scale: 'rpe' },
        { key: 'heartRate', label: 'FC' },
        { key: 'reps', label: '—' },
      ];
    default:
      return [];
  }
}

export function readTargetValue(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const planned = resolvePlannedSet(item.plannedSets, setIndex);

  if (item.type === 'strength') {
    if (key === 'reps') return formatTargetNumber(planned?.reps ?? item.repsMax ?? item.repsMin);
    if (key === 'rir') return formatTargetNumber(planned?.rir ?? item.targetRir);
    if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
    if (key === 'weight') {
      const kg = planned?.weightKg ?? item.weightRangeMaxKg ?? item.weightRangeMinKg;
      return kg != null ? `${kg}kg` : '-';
    }
  }
  if (item.type === 'cardio') {
    if (key === 'duration') return item.workSeconds ? `${item.workSeconds}s` : '-';
    if (key === 'distance') return item.targetDistanceMeters ? `${item.targetDistanceMeters}m` : '-';
    if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
    if (key === 'heartRate') return formatTargetNumber(planned?.heartRate);
  }
  if (item.type === 'plio') {
    if (key === 'reps') return formatTargetNumber(planned?.reps);
    if (key === 'weight') {
      const kg = planned?.weightKg;
      return kg != null ? `${kg}kg` : '-';
    }
    if (key === 'duration') return formatTargetSeconds(planned?.restSeconds ?? item.restSeconds);
    if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
  }
  if (item.type === 'mobility') {
    if (key === 'reps') return formatTargetNumber(planned?.reps);
    if (key === 'rom') return planned?.rom?.trim() ? planned.rom : '-';
    if (key === 'duration') return formatTargetSeconds(planned?.restSeconds ?? item.restSeconds);
    if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
  }
  if (item.type === 'isometric') {
    if (key === 'duration') return formatTargetSeconds(planned?.durationSeconds);
    if (key === 'weight') {
      const kg = planned?.weightKg;
      return kg != null ? `${kg}kg` : '-';
    }
    if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
    if (key === 'rest') return formatTargetSeconds(planned?.restSeconds ?? item.restSeconds);
  }
  if (item.type === 'sport') {
    if (key === 'duration') return `${item.durationMinutes}m`;
    if (key === 'rpe') return formatTargetNumber(planned?.rpe ?? item.targetRpe);
    if (key === 'heartRate') return formatTargetNumber(planned?.heartRate);
  }
  return '-';
}

function formatTargetNumber(value: null | number | undefined): string {
  return value != null ? String(value) : '-';
}

function formatTargetSeconds(value: null | number | undefined): string {
  return value != null && value > 0 ? `${value}s` : '-';
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
      return '';
    }
    case 'mobility': {
      const log = item.logs.find((entry) => entry.setIndex === setIndex);
      if (!log) return '';
      if (key === 'reps') return log.repsDone != null ? String(log.repsDone) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'rom') return log.romDone ?? '';
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
      if (key === 'distance') return log.distanceDoneMeters != null ? String(log.distanceDoneMeters) : '';
      if (key === 'rpe') return log.effortRpe != null ? String(log.effortRpe) : '';
      if (key === 'heartRate') return log.avgHeartRate != null ? String(log.avgHeartRate) : '';
      return '';
    }
    case 'sport': {
      if (!item.log) return '';
      if (key === 'duration') return item.log.durationMinutesDone != null ? String(item.log.durationMinutesDone) : '';
      if (key === 'rpe') return item.log.effortRpe != null ? String(item.log.effortRpe) : '';
      if (key === 'heartRate') return item.log.avgHeartRate != null ? String(item.log.avgHeartRate) : '';
      return '';
    }
    default:
      return '';
  }
}

export function getRestSeconds(item: SessionItem): number {
  if (isRestFieldLocked(item.lockedFields)) return 0;
  if (item.type === 'strength' || item.type === 'isometric') return item.restSeconds ?? 0;
  if (item.type === 'cardio' || item.type === 'plio' || item.type === 'mobility') return item.restSeconds;
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
        distanceDoneMeters: lockedOrDraftNumber(item, setIndex, 'distance', 'distance', values.distance),
        durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        intervalIndex: setIndex,
        sessionCardioBlockId: item.id,
      };
    case 'sport':
      return {
        avgHeartRate: lockedOrDraftNumber(item, setIndex, 'heartRate', 'heartRate', values.heartRate),
        durationMinutesDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
        effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
        sessionSportBlockId: item.id,
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

export type { StrengthSessionItem, SessionItem };
