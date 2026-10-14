import type { ClientView } from '@trainerpro/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { NoteData } from '../../screens/coach/notes-screen.types';
import type { FoodLibraryItem } from './useLibraryQuery';
import type { RoutineTemplateView } from './useRoutineTemplates';
import type { UnifiedExerciseItem, UnifiedExercisesFilter } from './useUnifiedLibraryQuery';
import type { WarmupTemplateView } from './useWarmupTemplates';
import { definedParams, PAGE_SIZE, useDebouncedValue, usePagedList, type PagedResponse } from './usePagedList';

type Auth = { accessToken: string; activeRole: 'admin' | 'coach' | 'client' };

export function useClientsPagedQuery(filter: { objective?: string; search?: string; sort: 'activity' | 'name' }) {
  const auth = useAuth();
  const search = useDebouncedValue(filter.search ?? '', 300);
  return usePagedList<ClientView>({
    enabled: Boolean(auth),
    fetchPage: (cursor) => fetchClientsPage(auth, { ...filter, cursor, search }),
    queryKey: ['clients', 'paged', search, filter.objective ?? '', filter.sort, auth?.accessToken],
  });
}

export function useNotesPagedQuery(filter: {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: 'client' | 'general';
}) {
  const auth = useAuth();
  return usePagedList<NoteData>({
    enabled: Boolean(auth),
    fetchPage: (cursor) => fetchNotesPage(auth, { ...filter, cursor }),
    queryKey: ['notes', 'paged', filter, auth?.accessToken],
  });
}

export function useFoodsPagedQuery(filter: {
  foodCategory?: string;
  foodType?: string;
  query?: string;
  servingUnit?: string;
}) {
  const auth = useAuth();
  const search = useDebouncedValue(filter.query ?? '', 300);
  return usePagedList<FoodLibraryItem>({
    enabled: Boolean(auth),
    fetchPage: (cursor) =>
      fetchItemsPage<FoodLibraryItem>(auth, '/library/foods', {
        cursor,
        foodCategory: filter.foodCategory,
        foodType: filter.foodType,
        query: search,
        servingUnit: filter.servingUnit,
      }),
    queryKey: [
      'library',
      'foods',
      'paged',
      search,
      filter.foodCategory,
      filter.foodType,
      filter.servingUnit,
      auth?.accessToken,
    ],
  });
}

export function useUnifiedExercisesPagedQuery(filter: UnifiedExercisesFilter) {
  const auth = useAuth();
  const search = useDebouncedValue(filter.search ?? '', 300);
  const stable = { ...filter, search };
  return usePagedList<UnifiedExerciseItem>({
    enabled: Boolean(auth),
    fetchPage: (cursor) => fetchUnifiedPage(auth, stable, cursor),
    queryKey: ['library', 'exercises', 'unified', 'paged', stable, auth?.accessToken],
  });
}

export function useRoutineTemplatesPagedQuery(search: string) {
  const auth = useAuth();
  const query = useDebouncedValue(search, 300);
  return usePagedList<RoutineTemplateView>({
    enabled: Boolean(auth),
    fetchPage: (cursor) => fetchItemsPage<RoutineTemplateView>(auth, '/plans/templates/routines', { cursor, search: query }),
    queryKey: ['routine-templates', 'paged', query, auth?.accessToken],
  });
}

export function useWarmupTemplatesPagedQuery(search: string) {
  const auth = useAuth();
  const query = useDebouncedValue(search, 300);
  return usePagedList<WarmupTemplateView>({
    enabled: Boolean(auth),
    fetchPage: (cursor) => fetchItemsPage<WarmupTemplateView>(auth, '/plans/templates/warmups', { cursor, search: query }),
    queryKey: ['warmup-templates', 'paged', query, auth?.accessToken],
  });
}

export function invalidatePagedLists(queryClient: ReturnType<typeof useQueryClient>, key: string): void {
  void queryClient.invalidateQueries({ queryKey: [key] });
  void queryClient.invalidateQueries({ queryKey: [key, 'paged'] });
}

function useAuth(): Auth | null {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchClientsPage(
  auth: Auth | null,
  filter: { cursor: string | null; objective?: string; search?: string; sort: 'activity' | 'name' },
): Promise<PagedResponse<ClientView>> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<PagedResponse<ClientView>>(
    '/clients',
    definedParams([
      ['cursor', filter.cursor ?? undefined],
      ['limit', PAGE_SIZE],
      ['objective', filter.objective],
      ['search', filter.search],
      ['sort', filter.sort],
    ]),
  );
}

async function fetchNotesPage(
  auth: Auth | null,
  filter: {
    clientId?: string;
    cursor: string | null;
    dateFrom?: string;
    dateTo?: string;
    scope?: 'client' | 'general';
  },
): Promise<PagedResponse<NoteData>> {
  if (!auth) throw new Error('Not authenticated');
  const response = await createApiClient(auth).get<{ data: NoteData[]; nextCursor?: string | null }>(
    '/notes',
    definedParams([
      ['clientId', filter.clientId],
      ['cursor', filter.cursor ?? undefined],
      ['dateFrom', filter.dateFrom],
      ['dateTo', filter.dateTo],
      ['limit', PAGE_SIZE],
      ['scope', filter.scope],
    ]),
  );
  return {
    items: response.data.map((note) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    })),
    nextCursor: response.nextCursor,
  };
}

async function fetchItemsPage<T extends { id: string }>(
  auth: Auth | null,
  path: string,
  filter: Record<string, string | null | undefined>,
): Promise<PagedResponse<T>> {
  if (!auth) throw new Error('Missing authenticated context');
  const params = definedParams([
    ...Object.entries(filter).map(([key, value]) => [key, value ?? undefined] as [string, string | undefined]),
    ['limit', PAGE_SIZE],
  ]);
  return createApiClient(auth).get<PagedResponse<T>>(path, params);
}

async function fetchUnifiedPage(
  auth: Auth | null,
  filter: UnifiedExercisesFilter,
  cursor: string | null,
): Promise<PagedResponse<UnifiedExerciseItem>> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<PagedResponse<UnifiedExerciseItem>>(
    '/library/exercises/all',
    definedParams([
      ['baseCategory', filter.baseCategory],
      ['cardioTypeIds', filter.cardioTypeIds?.join(',')],
      ['cursor', cursor ?? undefined],
      ['equipmentIds', filter.equipmentIds?.join(',')],
      ['isometricTypeIds', filter.isometricTypeIds?.join(',')],
      ['limit', PAGE_SIZE],
      ['mobilityTypeIds', filter.mobilityTypeIds?.join(',')],
      ['muscleGroupIds', filter.muscleGroupIds?.join(',')],
      ['plioTypeIds', filter.plioTypeIds?.join(',')],
      ['search', filter.search],
      ['sportTypeIds', filter.sportTypeIds?.join(',')],
    ]),
  );
}
