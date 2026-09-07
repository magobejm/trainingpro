import { Prisma } from '@prisma/client';
import { mapPlanSetsToPlannedSnapshots, type PlannedSetSnapshot } from './planned-set.mapper';
import { stripMetaNotes } from './parse-meta-notes';

export type SessionNoteSnapshot = {
  coachInstructions: null | string;
  notes: null | string;
  plannedSetsJson: PlannedSetSnapshot[];
};

export function buildSessionNoteSnapshot(input: {
  coachInstructions?: null | string;
  notes?: null | string;
  sets?: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
}): SessionNoteSnapshot {
  const plannedSetsJson = mapPlanSetsToPlannedSnapshots(input.sets);
  return {
    coachInstructions: normalizeText(input.coachInstructions),
    notes: stripMetaNotes(input.notes),
    plannedSetsJson,
  };
}

export function plannedSetsJsonToInput(value: PlannedSetSnapshot[]): Prisma.JsonValue {
  return value as unknown as Prisma.JsonValue;
}

export function readPlannedSetsJson(value: Prisma.JsonValue | null): PlannedSetSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return [];
      }
      const row = entry as Record<string, unknown>;
      const snapshot: PlannedSetSnapshot = {
        advancedTechnique: typeof row.advancedTechnique === 'string' ? row.advancedTechnique : null,
        note: typeof row.note === 'string' ? row.note : null,
        setIndex: typeof row.setIndex === 'number' ? row.setIndex : 0,
      };
      const durationSeconds = readOptionalNumber(row.durationSeconds);
      if (durationSeconds != null) snapshot.durationSeconds = durationSeconds;
      const fcMaxPct = readOptionalNumber(row.fcMaxPct);
      if (fcMaxPct != null) snapshot.fcMaxPct = fcMaxPct;
      const fcReservePct = readOptionalNumber(row.fcReservePct);
      if (fcReservePct != null) snapshot.fcReservePct = fcReservePct;
      const heartRate = readOptionalNumber(row.heartRate);
      if (heartRate != null) snapshot.heartRate = heartRate;
      const reps = readOptionalNumber(row.reps);
      if (reps != null) snapshot.reps = reps;
      const restSeconds = readOptionalNumber(row.restSeconds);
      if (restSeconds != null) snapshot.restSeconds = restSeconds;
      const rir = readOptionalNumber(row.rir);
      if (rir != null) snapshot.rir = rir;
      if (typeof row.rom === 'string') snapshot.rom = row.rom;
      const rpe = readOptionalNumber(row.rpe);
      if (rpe != null) snapshot.rpe = rpe;
      const weightKg = readOptionalNumber(row.weightKg);
      if (weightKg != null) snapshot.weightKg = weightKg;
      return [snapshot];
    })
    .sort((a, b) => a.setIndex - b.setIndex);
}

function readOptionalNumber(value: unknown): null | number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
