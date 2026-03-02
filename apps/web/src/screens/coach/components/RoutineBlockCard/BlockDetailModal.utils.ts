import { readFrontEnv } from '../../../../data/env';
import type { BlockType } from '../../RoutinePlanner.types';
import type {
  ExerciseLibraryItem,
  CardioMethodLibraryItem,
  PlioExerciseLibraryItem,
  WarmupExerciseLibraryItem,
  SportLibraryItem,
} from '../../../../data/hooks/useLibraryQuery';

export type DetailItem = {
  name: string;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  youtubeUrl: string | null;
};

export type LibraryItemUnion =
  | ExerciseLibraryItem
  | CardioMethodLibraryItem
  | PlioExerciseLibraryItem
  | WarmupExerciseLibraryItem
  | SportLibraryItem;

export type DetailSource = {
  items: Array<LibraryItemUnion>;
  isLoading: boolean;
  map: (item: LibraryItemUnion) => DetailItem;
};

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();
const PLACEHOLDERS: Record<BlockType, string> = {
  strength: `${API_BASE_URL}/assets/placeholders/plan-bg.jpg`,
  cardio: `${API_BASE_URL}/assets/placeholders/cardio-bg.jpg`,
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

export const mapExercise = (item: ExerciseLibraryItem): DetailItem => ({
  name: item.name,
  description: item.instructions ?? null,
  notes: null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
});

export const mapCardio = (item: CardioMethodLibraryItem): DetailItem => ({
  name: item.name,
  description: item.description ?? null,
  notes: null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
});

export const mapPlio = (item: PlioExerciseLibraryItem): DetailItem => ({
  name: item.name,
  description: item.description ?? null,
  notes: item.notes ?? null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
});

export const mapWarmup = (item: WarmupExerciseLibraryItem): DetailItem => ({
  name: item.name,
  description: item.description ?? null,
  notes: null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
});

export const mapSport = (item: SportLibraryItem): DetailItem => ({
  name: item.name,
  description: item.description ?? null,
  notes: null,
  imageUrl: item.mediaUrl ?? null,
  youtubeUrl: null,
});
