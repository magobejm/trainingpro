import type { BlockType } from '../../RoutinePlanner.types';
import { readFrontEnv } from '../../../../data/env';
import type {
  ExerciseLibraryItem,
  CardioMethodLibraryItem,
  IsometricExerciseLibraryItem,
  PlioExerciseLibraryItem,
  MobilityExerciseLibraryItem,
  SportLibraryItem,
} from '../../../../data/hooks/useLibraryQuery';
import type { LibraryItem } from './ExercisePickerModal.types';

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const API_BASE_URL = resolveApiBaseUrl();

const PLACEHOLDERS: Record<BlockType, string> = {
  strength: `${API_BASE_URL}/assets/placeholders/routine-placeholder.jpg`,
  cardio: `${API_BASE_URL}/assets/placeholders/cardio-bg.jpg`,
  isometric: `${API_BASE_URL}/assets/placeholders/isometric-placeholder.png`,
  plio: `${API_BASE_URL}/assets/placeholders/plio-placeholder.png`,
  warmup: `${API_BASE_URL}/assets/placeholders/warmup-placeholder.png`,
  sport: `${API_BASE_URL}/assets/placeholders/sports-placeholder.png`,
};

export function resolvePlaceholder(blockType: BlockType): string {
  return PLACEHOLDERS[blockType] ?? PLACEHOLDERS.strength;
}

export function getFullUrl(blockType: BlockType, url: string | null | undefined): string {
  const placeholder = resolvePlaceholder(blockType);
  if (!url || typeof url !== 'string' || url.trim() === '') return placeholder;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function mapExercises(items: ExerciseLibraryItem[]): LibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.instructions ?? null,
    notes: null,
    imageUrl: item.media?.url ?? null,
    youtubeUrl: item.youtubeUrl ?? null,
    muscleGroup: item.muscleGroup,
    equipment: item.equipment,
  }));
}

export function mapCardio(items: CardioMethodLibraryItem[]): LibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    notes: null,
    imageUrl: item.media?.url ?? null,
    youtubeUrl: item.youtubeUrl ?? null,
    methodType: item.methodType,
    equipment: item.equipment,
  }));
}

export function mapIsometric(items: IsometricExerciseLibraryItem[]): LibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    notes: item.notes ?? null,
    imageUrl: item.media?.url ?? null,
    youtubeUrl: item.youtubeUrl ?? null,
    methodType: item.isometricType ?? undefined,
  }));
}

export function mapPlio(items: PlioExerciseLibraryItem[]): LibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    notes: item.notes ?? null,
    imageUrl: item.media?.url ?? null,
    youtubeUrl: item.youtubeUrl ?? null,
    methodType: item.plioType ?? undefined,
    equipment: item.equipment,
  }));
}

export function mapWarmup(items: MobilityExerciseLibraryItem[]): LibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    notes: null,
    imageUrl: item.media?.url ?? null,
    youtubeUrl: item.youtubeUrl ?? null,
    methodType: item.mobilityType ?? undefined,
  }));
}

export function mapSports(items: SportLibraryItem[]): LibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    notes: null,
    imageUrl: item.mediaUrl ?? null,
    youtubeUrl: null,
  }));
}

export function filterByQuery(items: LibraryItem[], query: string): LibraryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.name.toLowerCase().includes(q));
}
