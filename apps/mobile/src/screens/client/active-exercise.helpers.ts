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
  if (item.type === 'strength') {
    if (key === 'reps') return String(item.repsMax ?? item.repsMin ?? '-');
    if (key === 'rir') return item.targetRir != null ? String(item.targetRir) : '-';
    if (key === 'rpe') return item.targetRpe != null ? String(item.targetRpe) : '-';
    if (key === 'weight') {
      if (item.weightRangeMaxKg != null) return `${item.weightRangeMaxKg}kg`;
      return '-';
    }
  }
  if (item.type === 'cardio') {
    if (key === 'duration') return item.workSeconds ? `${item.workSeconds}s` : '-';
    if (key === 'distance') return item.targetDistanceMeters ? `${item.targetDistanceMeters}m` : '-';
    if (key === 'rpe') return item.targetRpe != null ? String(item.targetRpe) : '-';
  }
  if (item.type === 'plio' || item.type === 'mobility') {
    if (key === 'duration') return item.restSeconds ? `${item.restSeconds}s` : '-';
    if (key === 'rpe') return item.targetRpe != null ? String(item.targetRpe) : '-';
  }
  if (item.type === 'isometric') {
    if (key === 'rpe') return item.targetRpe != null ? String(item.targetRpe) : '-';
    if (key === 'rest') return item.restSeconds ? `${item.restSeconds}s` : '-';
  }
  if (item.type === 'sport') {
    if (key === 'duration') return `${item.durationMinutes}m`;
    if (key === 'rpe') return item.targetRpe != null ? String(item.targetRpe) : '-';
  }
  void setIndex;
  return '-';
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
        effortRir: parseNumber(values.rir),
        effortRpe: parseNumber(values.rpe),
        repsDone: parseNumber(values.reps),
        sessionItemId: item.id,
        setIndex,
        weightDoneKg: parseNumber(values.weight),
      };
    case 'plio':
      return {
        effortRpe: parseNumber(values.rpe),
        repsDone: parseNumber(values.reps),
        sessionPlioBlockId: item.id,
        setIndex,
        weightDoneKg: parseNumber(values.weight),
      };
    case 'mobility':
      return {
        effortRpe: parseNumber(values.rpe),
        repsDone: parseNumber(values.reps),
        romDone: values.rom.trim() || null,
        sessionMobilityBlockId: item.id,
        setIndex,
      };
    case 'isometric':
      return {
        durationSecondsDone: parseNumber(values.duration),
        effortRpe: parseNumber(values.rpe),
        sessionIsometricBlockId: item.id,
        setIndex,
        weightDoneKg: parseNumber(values.weight),
      };
    case 'cardio':
      return {
        avgHeartRate: parseNumber(values.heartRate),
        distanceDoneMeters: parseNumber(values.distance),
        durationSecondsDone: parseNumber(values.duration),
        effortRpe: parseNumber(values.rpe),
        intervalIndex: setIndex,
        sessionCardioBlockId: item.id,
      };
    case 'sport':
      return {
        avgHeartRate: parseNumber(values.heartRate),
        durationMinutesDone: parseNumber(values.duration),
        effortRpe: parseNumber(values.rpe),
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
