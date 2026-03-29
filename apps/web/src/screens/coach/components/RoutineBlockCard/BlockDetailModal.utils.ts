import { readFrontEnv } from '../../../../data/env';
import type { BlockType, DraftBlock } from '../../RoutinePlanner.types';
import {
  useLibraryExercisesQuery,
  useLibraryCardioMethodsQuery,
  useLibraryPlioExercisesQuery,
  useLibraryMobilityExercisesQuery,
  useLibrarySportsQuery,
  type ExerciseLibraryItem,
  type CardioMethodLibraryItem,
  type PlioExerciseLibraryItem,
  type MobilityExerciseLibraryItem,
  type SportLibraryItem,
} from '../../../../data/hooks/useLibraryQuery';

export type DetailItem = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  youtubeUrl: string | null;
  muscleGroup?: string;
  methodType?: string;
  equipment?: string | null;
};

export type LibraryItemUnion =
  | ExerciseLibraryItem
  | CardioMethodLibraryItem
  | PlioExerciseLibraryItem
  | MobilityExerciseLibraryItem
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
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
  cardio: `${API_BASE_URL}/assets/placeholders/cardio-bg.jpg`,
  isometric: `${API_BASE_URL}/assets/placeholders/isometric-placeholder.png`,
  plio: `${API_BASE_URL}/assets/placeholders/plio-placeholder.png`,
  mobility: `${API_BASE_URL}/assets/placeholders/warmup-placeholder.png`,
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
  id: item.id,
  name: item.name,
  description: item.instructions ?? null,
  notes: null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
  muscleGroup: item.muscleGroup,
  equipment: item.equipment,
});

export const mapCardio = (item: CardioMethodLibraryItem): DetailItem => ({
  id: item.id,
  name: item.name,
  description: item.description ?? null,
  notes: null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
  methodType: item.methodType,
  equipment: item.equipment,
});

export const mapPlio = (item: PlioExerciseLibraryItem): DetailItem => ({
  id: item.id,
  name: item.name,
  description: item.description ?? null,
  notes: item.notes ?? null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
  methodType: item.plioType ?? undefined,
  equipment: item.equipment,
});

export const mapWarmup = (item: MobilityExerciseLibraryItem): DetailItem => ({
  id: item.id,
  name: item.name,
  description: item.description ?? null,
  notes: null,
  imageUrl: item.media?.url ?? null,
  youtubeUrl: item.youtubeUrl ?? null,
  methodType: item.mobilityType ?? undefined,
});

export const mapSport = (item: SportLibraryItem): DetailItem => ({
  id: item.id,
  name: item.name,
  description: item.description ?? null,
  notes: null,
  imageUrl: item.mediaUrl ?? null,
  youtubeUrl: null,
});

export function useLibrarySources(type: string, query: string) {
  const str = useLibraryExercisesQuery({ query: type === 'strength' ? query : undefined });
  const car = useLibraryCardioMethodsQuery({ query: type === 'cardio' ? query : undefined });
  const plio = useLibraryPlioExercisesQuery({ query: type === 'plio' ? query : undefined });
  const warm = useLibraryMobilityExercisesQuery({ query: type === 'mobility' ? query : undefined });
  const sport = useLibrarySportsQuery();
  const mapper = <T extends LibraryItemUnion>(m: (item: T) => DetailItem) => m as (item: LibraryItemUnion) => DetailItem;
  return {
    strength: { items: str.data ?? [], isLoading: str.isLoading, map: mapper(mapExercise) },
    cardio: { items: car.data ?? [], isLoading: car.isLoading, map: mapper(mapCardio) },
    plio: { items: plio.data ?? [], isLoading: plio.isLoading, map: mapper(mapPlio) },
    mobility: { items: warm.data ?? [], isLoading: warm.isLoading, map: mapper(mapWarmup) },
    sport: { items: sport.data ?? [], isLoading: sport.isLoading, map: mapper(mapSport) },
  };
}

export function useBlockDetail(block: DraftBlock): { item: DetailItem | null; isLoading: boolean } {
  const sources = useLibrarySources(block.type, block.displayName);
  const source = (sources as Record<string, DetailSource>)[block.type];
  if (!source) return { item: null, isLoading: false };
  const target = source.items.find((i) => i.id === block.libraryId || i.name === block.displayName) ?? null;
  return { item: target ? source.map(target) : null, isLoading: source.isLoading };
}
