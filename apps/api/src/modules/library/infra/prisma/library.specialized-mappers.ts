import {
  LibraryItemScope,
  type PlioExercise,
  type Sport,
  type WarmupExercise,
} from '@prisma/client';
import type { PlioExerciseLibraryItem } from '../../domain/entities/plio-exercise-library-item';
import type { SportLibraryItem } from '../../domain/entities/sport-library-item';
import type { WarmupExerciseLibraryItem } from '../../domain/entities/warmup-exercise-library-item';

export function mapPlioExercise(row: PlioExercise): PlioExerciseLibraryItem {
  const equipment = (row as unknown as { equipment?: null | string }).equipment ?? null;
  const plioType = (row as unknown as { plioType?: null | string }).plioType ?? null;
  return {
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    description: row.description,
    equipment,
    id: row.id,
    media: { type: row.mediaType, url: row.mediaUrl },
    name: row.name,
    plioType,
    notes: row.notes,
    scope: row.scope === LibraryItemScope.COACH ? 'coach' : 'global',
    updatedAt: row.updatedAt,
    youtubeUrl: row.youtubeUrl,
  };
}

export function mapWarmupExercise(row: WarmupExercise): WarmupExerciseLibraryItem {
  const mobilityType = (row as unknown as { mobilityType?: null | string }).mobilityType ?? null;
  return {
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    description: row.description,
    id: row.id,
    media: { type: row.mediaType, url: row.mediaUrl },
    mobilityType,
    name: row.name,
    scope: row.scope === LibraryItemScope.COACH ? 'coach' : 'global',
    updatedAt: row.updatedAt,
    youtubeUrl: row.youtubeUrl,
  };
}

export function mapSport(row: Sport): SportLibraryItem {
  return {
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    description: row.description,
    icon: row.icon,
    id: row.id,
    mediaUrl: row.mediaUrl,
    name: row.name,
    scope: row.scope === LibraryItemScope.COACH ? 'coach' : 'global',
    updatedAt: row.updatedAt,
  };
}

export function normalizeMobilityType(value: null | string): null | string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'completo' || normalized === 'parcial' || normalized === 'minimo') {
    return normalized;
  }
  return null;
}

export function normalizePlioType(value: null | string): null | string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'explosivo' || normalized === 'relajado' || normalized === 'undefined') {
    return normalized;
  }
  return null;
}
