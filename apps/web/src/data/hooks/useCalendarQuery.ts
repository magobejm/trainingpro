import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { normalizePlanTemplateId } from '../normalize-plan-template-id';
import { useAuthStore } from '../../store/auth.store';
import type { SessionProgressCategory } from '../types/session-progress';
import type { CalendarEventData } from '../../screens/coach/calendar-screen.types';

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

export type CreateCalendarEventInput = {
  type: 'note' | 'reminder' | 'workout';
  date: string;
  title?: string;
  content?: string;
  time?: string;
  color?: string;
  clientId?: string;
  planDayId?: string;
};

export type UpdateCalendarEventInput = {
  title?: string;
  content?: string;
  time?: string;
  color?: string;
  date?: string;
};

export function useCalendarEventsQuery(dateFrom: string, dateTo: string, clientId?: string, coachOnly?: boolean) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(dateFrom) && Boolean(dateTo),
    queryKey: ['calendar', 'events', dateFrom, dateTo, clientId, coachOnly],
    queryFn: async () => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (clientId) params.append('clientId', clientId);
      if (coachOnly) params.append('coachOnly', 'true');
      const response = await api.get<{ data: CalendarEventData[] }>(`/calendar?${params.toString()}`);
      return response.data.map((ev: CalendarEventData) => ({
        ...ev,
        date: new Date(ev.date),
        createdAt: new Date(ev.createdAt),
        updatedAt: new Date(ev.updatedAt),
      }));
    },
  });
}

export function useCreateCalendarEventMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const response = await api.post<CalendarEventData>('/calendar', input);
      return {
        ...response,
        date: new Date(response.date),
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async ({ eventId, input }: { eventId: string; input: UpdateCalendarEventInput }) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const response = await api.patch<CalendarEventData>(`/calendar/${eventId}`, input);
      return {
        ...response,
        date: new Date(response.date),
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!auth) throw new Error('Not authenticated');
      await createApiClient(auth).delete(`/calendar/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export type RoutineDayCard = {
  id: string;
  title: string;
  dayIndex: number;
  exerciseCount: number;
  color: string;
  categories: SessionProgressCategory[];
};

function inferRoutineDayCategories(day: {
  exercises?: unknown[];
  cardioBlocks?: unknown[];
  plioBlocks?: unknown[];
  mobilityBlocks?: unknown[];
  sportBlocks?: unknown[];
  isometricBlocks?: unknown[];
}): SessionProgressCategory[] {
  const out: SessionProgressCategory[] = [];
  if ((day.exercises?.length ?? 0) > 0) out.push('strength');
  if ((day.cardioBlocks?.length ?? 0) > 0) out.push('cardio');
  if ((day.plioBlocks?.length ?? 0) > 0) out.push('plio');
  if ((day.isometricBlocks?.length ?? 0) > 0) out.push('isometric');
  if ((day.mobilityBlocks?.length ?? 0) > 0) out.push('mobility');
  if ((day.sportBlocks?.length ?? 0) > 0) out.push('sport');
  return out;
}

export type RoutineTemplateBasic = {
  id: string;
  name: string;
  days: Array<{
    id: string;
    title: string;
    dayIndex: number;
    exercises?: unknown[];
    cardioBlocks?: unknown[];
    plioBlocks?: unknown[];
    mobilityBlocks?: unknown[];
    sportBlocks?: unknown[];
    isometricBlocks?: unknown[];
  }>;
};

export function useClientRoutineDaysQuery(trainingPlanId: string | null | undefined) {
  const auth = useAuth();
  const resolved =
    trainingPlanId !== undefined && trainingPlanId !== null && String(trainingPlanId).length > 0
      ? normalizePlanTemplateId(String(trainingPlanId))
      : undefined;
  return useQuery({
    enabled: Boolean(auth) && Boolean(resolved),
    queryKey: ['routine-template-days', resolved],
    queryFn: async () => {
      if (!auth || !resolved) return [];
      const api = createApiClient(auth);
      const response = await api.get<RoutineTemplateBasic>(`/plans/templates/routines/${resolved}`);
      return (response.days ?? []).map((day) => ({
        id: day.id,
        title: day.title,
        dayIndex: day.dayIndex,
        exerciseCount: Array.isArray(day.exercises) ? day.exercises.length : 0,
        color: '#dbeafe',
        categories: inferRoutineDayCategories(day as Parameters<typeof inferRoutineDayCategories>[0]),
      })) as RoutineDayCard[];
    },
  });
}
