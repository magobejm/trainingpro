import { formatHeartRateBand, toSetDisplayValue } from '@trainerpro/shared';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import type { SetFieldKey } from './active-exercise.helpers';

export function readActualValue(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  switch (item.type) {
    case 'strength':
      return strengthActual(item, setIndex, key);
    case 'plio':
      return plioActual(item, setIndex, key);
    case 'mobility':
      return mobilityActual(item, setIndex, key);
    case 'isometric':
      return isometricActual(item, setIndex, key);
    case 'cardio':
      return cardioActual(item, setIndex, key);
    case 'sport':
      return sportActual(item, setIndex, key);
    default:
      return '';
  }
}

function strengthActual(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const log = item.type === 'strength' ? item.logs.find((entry) => entry.setIndex === setIndex) : undefined;
  if (!log) return '';
  if (key === 'reps') return text(log.repsDone);
  if (key === 'rir') return text(log.effortRir);
  if (key === 'rpe') return text(log.effortRpe);
  if (key === 'weight') return text(log.weightDoneKg);
  return '';
}

function plioActual(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const log = item.type === 'plio' ? item.logs.find((entry) => entry.setIndex === setIndex) : undefined;
  if (!log) return '';
  if (key === 'reps') return text(log.repsDone);
  if (key === 'rpe') return text(log.effortRpe);
  if (key === 'weight') return text(log.weightDoneKg);
  if (key === 'duration') return text(log.durationSecondsDone);
  return '';
}

function mobilityActual(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const log = item.type === 'mobility' ? item.logs.find((entry) => entry.setIndex === setIndex) : undefined;
  if (!log) return '';
  if (key === 'reps') return text(log.repsDone);
  if (key === 'rpe') return text(log.effortRpe);
  if (key === 'rom') return log.romDone ?? '';
  if (key === 'weight') return text(log.weightDoneKg);
  return '';
}

function isometricActual(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const log = item.type === 'isometric' ? item.logs.find((entry) => entry.setIndex === setIndex) : undefined;
  if (!log) return '';
  if (key === 'duration') return text(log.durationSecondsDone);
  if (key === 'rpe') return text(log.effortRpe);
  if (key === 'weight') return text(log.weightDoneKg);
  return '';
}

function cardioActual(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const log = item.type === 'cardio' ? item.intervalLogs.find((entry) => entry.intervalIndex === setIndex) : undefined;
  if (!log) return '';
  if (key === 'distance') return log.distanceDoneMeters != null ? String(log.distanceDoneMeters / 1000) : '';
  if (key === 'duration') return seconds(item.type, log.durationSecondsDone);
  if (key === 'rpe') return text(log.effortRpe);
  if (key === 'fcMaxPct') return formatHeartRateBand(log.hrMaxPctDone, log.hrMaxPctDoneMax);
  if (key === 'fcReservePct') return formatHeartRateBand(log.hrReservePctDone, log.hrReservePctDoneMax);
  if (key === 'heartRate') return formatHeartRateBand(log.avgHeartRate, log.avgHeartRateMax);
  if (key === 'rest') return text(log.restSecondsDone);
  return '';
}

function sportActual(item: SessionItem, setIndex: number, key: SetFieldKey): string {
  const log = item.type === 'sport' ? (item.setLogs ?? []).find((entry) => entry.setIndex === setIndex) : undefined;
  if (!log) return '';
  if (key === 'reps') return text(log.repsDone);
  if (key === 'weight') return text(log.weightDoneKg);
  if (key === 'rpe') return text(log.effortRpe);
  if (key === 'fcMaxPct') return formatHeartRateBand(log.hrMaxPctDone, log.hrMaxPctDoneMax);
  if (key === 'distance') return log.distanceDoneMeters != null ? String(log.distanceDoneMeters / 1000) : '';
  if (key === 'duration') return seconds(item.type, log.durationSecondsDone);
  if (key === 'heartRate') return formatHeartRateBand(log.heartRateDone, log.heartRateDoneMax);
  if (key === 'rir') return text(log.effortRir);
  if (key === 'fcReservePct') return formatHeartRateBand(log.hrReservePctDone, log.hrReservePctDoneMax);
  if (key === 'rom') return log.romDone ?? '';
  if (key === 'rest') return text(log.restSecondsDone);
  return '';
}

function seconds(type: SessionItem['type'], value: null | number | undefined): string {
  return value != null ? String(toSetDisplayValue(type, 'durationSeconds', value)) : '';
}

function text(value: null | number | undefined): string {
  return value != null ? String(value) : '';
}
