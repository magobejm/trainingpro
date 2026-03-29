/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldMode } from '@prisma/client';

export function mapExercisesForSeed(exercises: any[]) {
  return {
    create: (exercises ?? []).map((e) => ({
      displayName: e.displayName,
      sortOrder: e.sortOrder,
      fieldModes: {
        create: e.fieldModes.map((fm: any) => ({
          fieldKey: fm.fieldKey,
          mode: fm.mode as FieldMode,
        })),
      },
    })),
  };
}

export function mapCardioBlocksForSeed(cardioBlocks: any[]) {
  return {
    create: (cardioBlocks ?? []).map((c: any) => ({
      displayName: c.displayName,
      sortOrder: c.sortOrder,
      workSeconds: c.workSeconds,
      restSeconds: c.restSeconds,
      fieldModes: {
        create: (c.fieldModes ?? []).map((fm: any) => ({
          fieldKey: fm.fieldKey,
          mode: fm.mode as FieldMode,
        })),
      },
    })),
  };
}

export function mapTimedBlocksForSeed(blocks: any[]) {
  return {
    create: (blocks ?? []).map((b: any) => ({
      displayName: b.displayName,
      sortOrder: b.sortOrder,
      workSeconds: b.workSeconds,
      restSeconds: b.restSeconds,
    })),
  };
}

export function mapDayForSeed(day: any) {
  return {
    title: day.title,
    dayIndex: day.dayIndex,
    exercises: mapExercisesForSeed(day.exercises as any[]),
    cardioBlocks: mapCardioBlocksForSeed(day.cardioBlocks as any[]),
    plioBlocks: mapTimedBlocksForSeed(day.plioBlocks as any[]),
    mobilityBlocks: mapTimedBlocksForSeed(day.mobilityBlocks as any[]),
    sportBlocks: {
      create: (day.sportBlocks ?? []).map((s: any) => ({
        displayName: s.displayName,
        sortOrder: s.sortOrder,
        durationMinutes: s.durationMinutes,
      })),
    },
  };
}

export function readRequiredId(index: Map<string, string>, code: string): string {
  const id = index.get(code);
  if (id) {
    return id;
  }
  throw new Error(`Missing catalog seed for code: ${code}`);
}
