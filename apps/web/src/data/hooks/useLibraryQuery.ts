import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type Scope = 'coach' | 'global';

type LibraryMedia = {
  type: null | string;
  url: null | string;
};

export type LibraryCatalogItem = {
  id: string;
  isDefault: boolean;
  label: string;
};

export type ExerciseLibraryItem = {
  coachMembershipId: null | string;
  equipment: null | string;
  id: string;
  instructions: null | string;
  media: LibraryMedia;
  muscleGroup: string;
  muscleGroupId: string;
  name: string;
  scope: Scope;
  youtubeUrl: null | string;
};

export type CardioMethodLibraryItem = {
  coachMembershipId: null | string;
  description: null | string;
  equipment: null | string;
  id: string;
  media: LibraryMedia;
  methodType: string;
  methodTypeId: string;
  name: string;
  scope: Scope;
  youtubeUrl: null | string;
};

export type PlioExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  equipment: null | string;
  id: string;
  media: LibraryMedia;
  name: string;
  plioType: null | string;
  notes: null | string;
  scope: Scope;
  updatedAt: Date;
  youtubeUrl: null | string;
};

export type IsometricExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  equipment: null | string;
  id: string;
  isometricType: null | string;
  media: LibraryMedia;
  name: string;
  notes: null | string;
  scope: Scope;
  updatedAt: Date;
  youtubeUrl: null | string;
};

export type MobilityExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  id: string;
  media: LibraryMedia;
  mobilityType: null | string;
  name: string;
  scope: Scope;
  updatedAt: Date;
  youtubeUrl: null | string;
};

export type SportLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  icon: string;
  id: string;
  mediaUrl: null | string;
  name: string;
  scope: Scope;
  updatedAt: Date;
};

export type FoodLibraryItem = {
  caloriesKcal: null | number;
  carbsG: null | number;
  fatG: null | number;
  foodCategory: null | string;
  foodType: null | string;
  id: string;
  media: LibraryMedia;
  name: string;
  notes: null | string;
  proteinG: null | number;
  scope: Scope;
  servingUnit: null | string;
};

type ListResponse<T> = {
  items: T[];
};

export function useLibraryCardioMethodTypesQuery(): UseQueryResult<LibraryCatalogItem[], Error> {
  return useCatalogQuery('cardio-method-types');
}

export function useLibraryExerciseMuscleGroupsQuery(): UseQueryResult<LibraryCatalogItem[], Error> {
  return useCatalogQuery('muscle-groups');
}

export function useLibraryIsometricTypesQuery(): UseQueryResult<LibraryCatalogItem[], Error> {
  return useCatalogQuery('isometric-types');
}

export function useLibraryPlioTypesQuery(): UseQueryResult<LibraryCatalogItem[], Error> {
  return useCatalogQuery('plio-types');
}

export function useLibraryMobilityTypesQuery(): UseQueryResult<LibraryCatalogItem[], Error> {
  return useCatalogQuery('mobility-types');
}

export function useLibraryCardioMethodsQuery(filter: {
  methodTypeId?: string;
  query?: string;
}): UseQueryResult<CardioMethodLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () =>
      fetchLibraryList<CardioMethodLibraryItem>(auth, '/library/cardio-methods', filter),
    queryKey: ['library', 'cardio-methods', filter, auth?.activeRole, auth?.accessToken],
  });
}

export function useLibraryExercisesQuery(filter: {
  muscleGroupId?: string;
  query?: string;
}): UseQueryResult<ExerciseLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<ExerciseLibraryItem>(auth, '/library/exercises', filter),
    queryKey: ['library', 'exercises', filter, auth?.activeRole, auth?.accessToken],
  });
}

export function useLibraryFoodsQuery(filter: {
  foodCategory?: string;
  foodType?: string;
  query?: string;
  servingUnit?: string;
}): UseQueryResult<FoodLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<FoodLibraryItem>(auth, '/library/foods', filter),
    queryKey: ['library', 'foods', filter, auth?.activeRole, auth?.accessToken],
  });
}

export function useLibraryIsometricExercisesQuery(filter: {
  isometricType?: string;
  query?: string;
}): UseQueryResult<IsometricExerciseLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<IsometricExerciseLibraryItem>(auth, '/library/isometrics', filter),
    queryKey: ['library', 'isometrics', filter, auth?.activeRole, auth?.accessToken],
  });
}

export function useLibraryPlioExercisesQuery(filter: {
  plioType?: string;
  query?: string;
}): UseQueryResult<PlioExerciseLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<PlioExerciseLibraryItem>(auth, '/library/plyometrics', filter),
    queryKey: ['library', 'plyometrics', filter, auth?.activeRole, auth?.accessToken],
  });
}

export function useLibraryMobilityExercisesQuery(filter: {
  mobilityType?: string;
  query?: string;
}): UseQueryResult<MobilityExerciseLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<MobilityExerciseLibraryItem>(auth, '/library/mobility', filter),
    queryKey: ['library', 'mobility', filter, auth?.activeRole, auth?.accessToken],
  });
}

export function useLibrarySportsQuery(): UseQueryResult<SportLibraryItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<SportLibraryItem>(auth, '/library/sports', {}),
    queryKey: ['library', 'sports', auth?.activeRole, auth?.accessToken],
  });
}

function useCatalogQuery(
  resource: 'cardio-method-types' | 'isometric-types' | 'mobility-types' | 'muscle-groups' | 'plio-types',
): UseQueryResult<LibraryCatalogItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchLibraryList<LibraryCatalogItem>(auth, `/library/catalogs/${resource}`, {}),
    queryKey: ['library', 'catalogs', resource, auth?.activeRole, auth?.accessToken],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

async function fetchLibraryList<T>(
  auth: ReturnType<typeof useAuth>,
  path: string,
  query: Record<string, string | undefined>,
): Promise<T[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const params = buildSearchParams(query);
  const response = await createApiClient(auth).get<ListResponse<T>>(`${path}${params}`);
  return response.items;
}

function buildSearchParams(query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      params.set(key, value.trim());
    }
  }
  const raw = params.toString();
  return raw ? `?${raw}` : '';
}
