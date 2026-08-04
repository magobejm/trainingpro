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
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      return {
        advancedTechnique: typeof row.advancedTechnique === 'string' ? row.advancedTechnique : null,
        note: typeof row.note === 'string' ? row.note : null,
        setIndex: typeof row.setIndex === 'number' ? row.setIndex : 0,
      };
    })
    .filter((entry): entry is PlannedSetSnapshot => entry !== null)
    .sort((a, b) => a.setIndex - b.setIndex);
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
