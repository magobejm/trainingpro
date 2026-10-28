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
import {
  formatHeartRateBand,
  parseHeartRateBand,
  toSetDisplayValue,
  fromSetDisplayValue,
  usesMinuteDuration,
  resolveLockedFields,
  setVariablesForType,
  type HeartRateBand,
  type HeartRateBandKind,
  type SetVariableKey,
} from '@trainerpro/shared';
import { readActualValue } from './active-exercise.read';
import { exerciseTypeShowsRepRange, formatRepRangeBounds } from './routine-exercise-set.utils';
import { formatRestLabel } from './session-completion.utils';

export { readActualValue };

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
  labelKey: string;
  minutes?: boolean;
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
  return filterActiveSetColumns(columns, resolveLockedFields(item.type, item.lockedFields)).filter(
    (column) => column.key !== 'rest' || item.type === 'sport' || item.type === 'cardio',
  );
}

const ACTIVE_COLUMN_BY_KEY: Record<SetVariableKey, SetColumn> = {
  reps: { key: 'reps', labelKey: 'mobile.client.history.reps' },
  weightKg: { key: 'weight', labelKey: 'mobile.client.history.weight' },
  rpe: { key: 'rpe', labelKey: 'mobile.client.history.rpe', scale: 'rpe' },
  fcMaxPct: { key: 'fcMaxPct', labelKey: 'mobile.client.history.fcMaxPct' },
  distanceMeters: { key: 'distance', labelKey: 'mobile.client.history.distanceKm' },
  durationSeconds: { key: 'duration', labelKey: 'mobile.client.history.duration' },
  heartRate: { key: 'heartRate', labelKey: 'mobile.client.history.heartRate' },
  rir: { key: 'rir', labelKey: 'mobile.client.history.rir', scale: 'rir' },
  fcReservePct: { key: 'fcReservePct', labelKey: 'mobile.client.history.fcReservePct' },
  rom: { key: 'rom', labelKey: 'mobile.client.history.rom', scale: 'rom' },
  restSeconds: { key: 'rest', labelKey: 'mobile.client.history.rest' },
};

function getBaseSetColumns(item: SessionItem): SetColumn[] {
  return setVariablesForType(item.type).map((key) =>
    key === 'durationSeconds' && usesMinuteDuration(item.type)
      ? {
          ...ACTIVE_COLUMN_BY_KEY[key],
          labelKey: 'mobile.client.history.durationMinutes',
          minutes: true,
        }
      : ACTIVE_COLUMN_BY_KEY[key],
  );
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
  if (key === 'heartRate') return formatTargetBand(planned?.heartRate, planned?.heartRateMax);
  if (key === 'fcMaxPct') return formatTargetBand(planned?.fcMaxPct, planned?.fcMaxPctMax);
  if (key === 'fcReservePct') return formatTargetBand(planned?.fcReservePct, planned?.fcReservePctMax);
  if (key === 'rest') {
    const rest = planned?.restSeconds ?? ('restSeconds' in item ? item.restSeconds : null);
    return formatTargetSeconds(rest);
  }
  if (key === 'distance') {
    const metres = planned?.distanceMeters ?? (item.type === 'cardio' ? item.targetDistanceMeters : null);
    return metres == null ? '-' : `${metres / 1000} km`;
  }
  if (key === 'duration') {
    if (usesMinuteDuration(item.type)) {
      const seconds =
        planned?.durationSeconds ??
        (item.type === 'cardio' ? item.workSeconds : item.type === 'sport' ? item.durationMinutes * 60 : null);
      return seconds == null ? '-' : `${toSetDisplayValue(item.type, 'durationSeconds', seconds)} min`;
    }
    if (planned?.durationSeconds != null) return formatTargetSeconds(planned.durationSeconds);
    if (item.type === 'cardio' && item.workSeconds) return `${item.workSeconds}s`;
    if (item.type === 'sport') return `${item.durationMinutes * 60}s`;
    return '-';
  }
  return '-';
}

function formatTargetBand(min: null | number | undefined, max: null | number | undefined): string {
  return formatHeartRateBand(min, max) || '-';
}

function formatTargetNumber(value: null | number | undefined): string {
  return value != null ? String(value) : '-';
}

function formatTargetSeconds(value: null | number | undefined): string {
  return value != null && value > 0 ? formatRestLabel(value) : '-';
}

export function getRestSeconds(item: SessionItem, setIndex: number): number {
  if (isRestFieldLocked(resolveLockedFields(item.type, item.lockedFields))) return 0;
  const planned = resolvePlannedSet(item.plannedSets, setIndex)?.restSeconds;
  if (planned != null && planned > 0) return planned;
  if ('restSeconds' in item && item.restSeconds != null && item.restSeconds > 0) return item.restSeconds;
  return 0;
}

export function elapsedRestSeconds(endAt: number, totalSeconds: number, now = Date.now()): number {
  const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));
  return Math.max(0, totalSeconds - remaining);
}

export function readLoggedRestSeconds(item: SessionItem, setIndex: number): number | undefined {
  const value = readRestSeconds(item, setIndex);
  return value != null && value > 0 ? value : undefined;
}

function readRestSeconds(item: SessionItem, setIndex: number): null | number | undefined {
  switch (item.type) {
    case 'strength':
    case 'plio':
    case 'mobility':
    case 'isometric':
      return item.logs.find((entry) => entry.setIndex === setIndex)?.restSecondsDone;
    case 'cardio':
      return item.intervalLogs.find((entry) => entry.intervalIndex === setIndex)?.restSecondsDone;
    case 'sport':
      return (item.setLogs ?? []).find((entry) => entry.setIndex === setIndex)?.restSecondsDone;
    default:
      return undefined;
  }
}

export function restWasRecorded(item: SessionItem, setIndex: number): boolean {
  switch (item.type) {
    case 'strength':
    case 'plio':
    case 'mobility':
    case 'isometric':
      return item.logs.some((entry) => entry.setIndex === setIndex && entry.restSecondsDone != null);
    case 'cardio':
      return item.intervalLogs.some((entry) => entry.intervalIndex === setIndex && entry.restSecondsDone != null);
    case 'sport':
      return (item.setLogs ?? []).some((entry) => entry.setIndex === setIndex && entry.restSecondsDone != null);
    default:
      return false;
  }
}

function parseNumber(value: string): null | number {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function cardioLogPayload(item: SessionItem, setIndex: number, values: SetRowState): LogPayload {
  const heart = lockedOrDraftBand(item, setIndex, 'heartRate', 'heartRate', values.heartRate, 'heartRate');
  const fcMax = lockedOrDraftBand(item, setIndex, 'fcMaxPct', 'fcMaxPct', values.fcMaxPct, 'percent');
  const reserve = lockedOrDraftBand(item, setIndex, 'fcReservePct', 'fcReservePct', values.fcReservePct, 'percent');
  return {
    avgHeartRate: heart.min,
    avgHeartRateMax: heart.max,
    distanceDoneMeters: lockedOrDraftNumber(item, setIndex, 'distanceMeters', 'distance', values.distance),
    durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
    effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
    hrMaxPctDone: fcMax.min,
    hrMaxPctDoneMax: fcMax.max,
    hrReservePctDone: reserve.min,
    hrReservePctDoneMax: reserve.max,
    intervalIndex: setIndex,
    restSecondsDone: lockedOrDraftNumber(item, setIndex, 'restSeconds', 'rest', values.rest),
    sessionCardioBlockId: item.id,
  };
}

function sportLogPayload(item: SessionItem, setIndex: number, values: SetRowState): LogPayload {
  const heart = lockedOrDraftBand(item, setIndex, 'heartRate', 'heartRate', values.heartRate, 'heartRate');
  const fcMax = lockedOrDraftBand(item, setIndex, 'fcMaxPct', 'fcMaxPct', values.fcMaxPct, 'percent');
  const reserve = lockedOrDraftBand(item, setIndex, 'fcReservePct', 'fcReservePct', values.fcReservePct, 'percent');
  return {
    distanceDoneMeters: lockedOrDraftNumber(item, setIndex, 'distanceMeters', 'distance', values.distance),
    durationSecondsDone: lockedOrDraftNumber(item, setIndex, 'durationSeconds', 'duration', values.duration),
    effortRir: lockedOrDraftNumber(item, setIndex, 'rir', 'rir', values.rir),
    effortRpe: lockedOrDraftNumber(item, setIndex, 'rpe', 'rpe', values.rpe),
    heartRateDone: heart.min,
    heartRateDoneMax: heart.max,
    hrMaxPctDone: fcMax.min,
    hrMaxPctDoneMax: fcMax.max,
    hrReservePctDone: reserve.min,
    hrReservePctDoneMax: reserve.max,
    repsDone: lockedOrDraftNumber(item, setIndex, 'reps', 'reps', values.reps),
    restSecondsDone: lockedOrDraftNumber(item, setIndex, 'restSeconds', 'rest', values.rest),
    romDone: lockedOrDraftText(item, setIndex, 'rom', 'rom', values.rom),
    sessionSportBlockId: item.id,
    setIndex,
    weightDoneKg: lockedOrDraftNumber(item, setIndex, 'weightKg', 'weight', values.weight),
  };
}

function lockedOrDraftBand(
  item: SessionItem,
  setIndex: number,
  webFieldKey: string,
  activeKey: SetFieldKey,
  draftValue: string,
  kind: HeartRateBandKind,
): HeartRateBand {
  const locked = isFieldLocked(resolveLockedFields(item.type, item.lockedFields), webFieldKey);
  const raw = locked ? readActualValue(item, setIndex, activeKey) : draftValue;
  const parsed = parseHeartRateBand(raw, kind);
  if (parsed) return parsed;
  if (!locked && raw.trim()) {
    return parseHeartRateBand(readActualValue(item, setIndex, activeKey), kind) ?? emptyBand();
  }
  return emptyBand();
}

function emptyBand(): HeartRateBand {
  return { max: null, min: null };
}

function lockedOrDraftNumber(
  item: SessionItem,
  setIndex: number,
  webFieldKey: string,
  activeKey: SetFieldKey,
  draftValue: string,
): null | number {
  const raw = isFieldLocked(resolveLockedFields(item.type, item.lockedFields), webFieldKey)
    ? readActualValue(item, setIndex, activeKey)
    : draftValue;
  const value = parseNumber(raw);
  return value == null ? null : fromSetDisplayValue(item.type, webFieldKey, value);
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

export type LogPayload =
  | LogIntervalMutationInput
  | LogIsometricSetMutationInput
  | LogMobilitySetMutationInput
  | LogPlioSetMutationInput
  | LogSetMutationInput
  | LogSportMutationInput;

const IDENTITY_KEYS = new Set([
  'intervalIndex',
  'sessionCardioBlockId',
  'sessionIsometricBlockId',
  'sessionItemId',
  'sessionMobilityBlockId',
  'sessionPlioBlockId',
  'sessionSportBlockId',
  'setIndex',
]);

function blankDraft(): SetRowState {
  return {
    distance: '',
    duration: '',
    fcMaxPct: '',
    fcReservePct: '',
    heartRate: '',
    reps: '',
    rest: '',
    rir: '',
    rpe: '',
    rom: '',
    weight: '',
  };
}

function logPayloadHasData(payload: LogPayload): boolean {
  return Object.entries(payload).some(([key, value]) => {
    if (IDENTITY_KEYS.has(key) || key === 'restSecondsDone') return false;
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
  });
}

export function buildLogPayload(
  item: SessionItem,
  setIndex: number,
  values: SetRowState,
  restSecondsDone?: number,
): LogPayload | null {
  const payload = buildRawLogPayload(item, setIndex, values);
  if (!payload || !logPayloadHasData(payload)) return null;
  if (restSecondsDone == null) return payload;
  return { ...payload, restSecondsDone };
}

export function buildClearPayload(item: SessionItem, setIndex: number): LogPayload | null {
  return buildRawLogPayload(item, setIndex, blankDraft());
}

export function resolveSetSave(payload: LogPayload | null, alreadyLogged: boolean): 'delete' | 'save' | 'skip' {
  if (payload) return 'save';
  return alreadyLogged ? 'delete' : 'skip';
}

export function setWasLogged(item: SessionItem, setIndex: number): boolean {
  switch (item.type) {
    case 'strength':
    case 'plio':
    case 'mobility':
    case 'isometric':
      return item.logs.some((entry) => entry.setIndex === setIndex);
    case 'cardio':
      return item.intervalLogs.some((entry) => entry.intervalIndex === setIndex);
    case 'sport':
      return (item.setLogs ?? []).some((entry) => entry.setIndex === setIndex);
    default:
      return false;
  }
}

function buildRawLogPayload(item: SessionItem, setIndex: number, values: SetRowState): LogPayload | null {
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
      return cardioLogPayload(item, setIndex, values);
    case 'sport':
      return sportLogPayload(item, setIndex, values);
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
  return item.sourceExerciseId ?? null;
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
