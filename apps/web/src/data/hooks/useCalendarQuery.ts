import { useFeedbackMutation } from './useFeedbackMutation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { normalizePlanTemplateId } from '../normalize-plan-template-id';
import { useAuthStore } from '../../store/auth.store';
import type { SessionProgressCategory } from '../types/session-progress';
import type { CalendarEventData } from '../../screens/coach/calendar-screen.types';
import { calendarStoredColor } from '../calendar-stored-color';
import { lightColors } from '@trainerpro/ui';
import type { RoutineDayColors } from '@trainerpro/shared';

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

export type CreateCalendarEventInput = {
  type: 'call' | 'note' | 'reminder' | 'workout';
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
        isCompleted: Boolean(ev.isCompleted),
        originDate: ev.originDate ? String(ev.originDate).slice(0, 10) : null,
        createdAt: new Date(ev.createdAt),
        updatedAt: new Date(ev.updatedAt),
      }));
    },
  });
}

export function useCreateCalendarEventMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useFeedbackMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const response = await api.post<CalendarEventData>('/calendar', { ...input, color: calendarStoredColor(input.color) });
      return {
        ...response,
        date: new Date(response.date),
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useFeedbackMutation({
    mutationFn: async ({ eventId, input }: { eventId: string; input: UpdateCalendarEventInput }) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const response = await api.patch<CalendarEventData>(`/calendar/${eventId}`, {
        ...input,
        color: calendarStoredColor(input.color),
      });
      return {
        ...response,
        date: new Date(response.date),
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useFeedbackMutation({
    mutationFn: async (eventId: string) => {
      if (!auth) throw new Error('Not authenticated');
      await createApiClient(auth).delete(`/calendar/${eventId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
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

type RoutineDayBlocks = {
  exercises?: unknown[];
  cardioBlocks?: unknown[];
  plioBlocks?: unknown[];
  mobilityBlocks?: unknown[];
  sportBlocks?: unknown[];
  isometricBlocks?: unknown[];
};

function blockCount(items: unknown[] | undefined): number {
  return Array.isArray(items) ? items.length : 0;
}

/** Strength plus every other block. The client app lists them all as exercises. */
export function countRoutineDayExercises(day: RoutineDayBlocks): number {
  return (
    blockCount(day.exercises) +
    blockCount(day.cardioBlocks) +
    blockCount(day.plioBlocks) +
    blockCount(day.mobilityBlocks) +
    blockCount(day.sportBlocks) +
    blockCount(day.isometricBlocks)
  );
}

function inferRoutineDayCategories(day: RoutineDayBlocks): SessionProgressCategory[] {
  const out: SessionProgressCategory[] = [];
  if (blockCount(day.exercises) > 0) out.push('strength');
  if (blockCount(day.cardioBlocks) > 0) out.push('cardio');
  if (blockCount(day.plioBlocks) > 0) out.push('plio');
  if (blockCount(day.isometricBlocks) > 0) out.push('isometric');
  if (blockCount(day.mobilityBlocks) > 0) out.push('mobility');
  if (blockCount(day.sportBlocks) > 0) out.push('sport');
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

export function useClientRoutineDaysQuery(trainingPlanId: string | null | undefined, clientId?: string) {
  const auth = useAuth();
  const resolved =
    trainingPlanId !== undefined && trainingPlanId !== null && String(trainingPlanId).length > 0
      ? normalizePlanTemplateId(String(trainingPlanId))
      : undefined;
  return useQuery({
    enabled: Boolean(auth) && Boolean(resolved),
    queryKey: ['routine-template-days', resolved, clientId],
    queryFn: async () => {
      if (!auth || !resolved) return [];
      const api = createApiClient(auth);
      const [response, preferences] = await Promise.all([
        api.get<RoutineTemplateBasic>(
          clientId ? `/clients/${clientId}/routine-assignments/current` : `/plans/templates/routines/${resolved}`,
        ),
        clientId ? api.get<RoutineDayColors>(`/clients/${clientId}/routine-day-colors`) : Promise.resolve({ colors: [] }),
      ]);
      const savedColors = new Map(preferences.colors.map((entry) => [entry.planDayId, entry.color]));
      return (response.days ?? []).map((day) => ({
        id: day.id,
        title: day.title,
        dayIndex: day.dayIndex,
        exerciseCount: countRoutineDayExercises(day),
        color: savedColors.get(day.id) ?? lightColors.primarySoft,
        categories: inferRoutineDayCategories(day as Parameters<typeof inferRoutineDayCategories>[0]),
      })) as RoutineDayCard[];
    },
  });
}

export function useSaveRoutineDayColorMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useFeedbackMutation({
    scope: { id: 'routine-day-colors' },
    mutationFn: async (input: { clientId: string; trainingPlanId: string; planDayId: string; color: string }) => {
      if (!auth) throw new Error('Not authenticated');
      return createApiClient(auth).patch<{ planDayId: string; color: string }>(
        `/clients/${input.clientId}/routine-day-colors/${input.planDayId}`,
        { color: calendarStoredColor(input.color) },
      );
    },
    onSuccess: (saved, input) => {
      const queryKey = ['routine-template-days', normalizePlanTemplateId(input.trainingPlanId), input.clientId];
      queryClient.setQueryData<RoutineDayCard[]>(queryKey, (days) =>
        days?.map((day) => (day.id === saved.planDayId ? { ...day, color: saved.color } : day)),
      );
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
