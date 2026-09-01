import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient, UnauthorizedApiError } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ClientRoutineSet = {
  advancedTechnique: null | string;
  note: null | string;
  setIndex: number;
};

export type ClientRoutineExercise = {
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  notes: null | string;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  sets: ClientRoutineSet[];
  setsPlanned: null | number;
  sortOrder: number;
  targetRir: null | number;
  targetRpe: null | number;
  type: 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';
};

export type ClientRoutineDay = {
  dayIndex: number;
  exercises: ClientRoutineExercise[];
  id: string;
  notes: null | string;
  title: string;
};

export type ClientRoutine = {
  expectedCompletionDays: null | number;
  id: string;
  name: string;
  objectives: string[];
  planDays: ClientRoutineDay[];
};

export function useClientRoutineQuery(): UseQueryResult<ClientRoutine, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: async () => {
      try {
        return await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutine>(
          '/clients/me/routine',
        );
      } catch (error) {
        if (error instanceof UnauthorizedApiError) {
          clearSession();
        }
        throw error;
      }
    },
    queryKey: ['clients', 'me', 'routine'],
  });
}

export function useClientPlanDayQuery(planDayId: string | null): UseQueryResult<ClientRoutineDay, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  return useQuery({
    enabled: Boolean(accessToken && planDayId),
    queryFn: async () => {
      try {
        return await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
          `/clients/me/plan-days/${planDayId}`,
        );
      } catch (error) {
        if (error instanceof UnauthorizedApiError) {
          clearSession();
        }
        throw error;
      }
    },
    queryKey: ['clients', 'me', 'plan-days', planDayId],
  });
}
