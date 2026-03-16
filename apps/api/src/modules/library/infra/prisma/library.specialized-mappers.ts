import {
  LibraryItemScope,
  type IsometricExercise,
  type PlioExercise,
  type Sport,
  type MobilityExercise,
} from '@prisma/client';
import type { IsometricExerciseLibraryItem } from '../../domain/entities/isometric-exercise-library-item';
import type { PlioExerciseLibraryItem } from '../../domain/entities/plio-exercise-library-item';
import type { SportLibraryItem } from '../../domain/entities/sport-library-item';
import type { MobilityExerciseLibraryItem } from '../../domain/entities/mobility-exercise-library-item';

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

export function mapMobilityExercise(row: MobilityExercise): MobilityExerciseLibraryItem {
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
  if (normalized === 'intensive' || normalized === 'extensive' || normalized === 'undefined') {
    return normalized;
  }
  return null;
}

export function mapIsometricExercise(row: IsometricExercise): IsometricExerciseLibraryItem {
  const equipment = (row as unknown as { equipment?: null | string }).equipment ?? null;
  const isometricType = (row as unknown as { isometricType?: null | string }).isometricType ?? null;
  return {
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    description: row.description,
    equipment,
    id: row.id,
    isometricType,
    media: { type: row.mediaType, url: row.mediaUrl },
    name: row.name,
    notes: row.notes,
    scope: row.scope === LibraryItemScope.COACH ? 'coach' : 'global',
    updatedAt: row.updatedAt,
    youtubeUrl: row.youtubeUrl,
  };
}

export function normalizeIsometricType(value: null | string): null | string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'total' || normalized === 'maxima' || normalized === 'undefined') {
    return normalized;
  }
  return null;
}
