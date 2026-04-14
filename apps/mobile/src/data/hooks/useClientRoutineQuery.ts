import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ClientRoutineExercise = {
  displayName: string;
  id: string;
  notes: null | string;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
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
  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutine>('/clients/me/routine'),
    queryKey: ['clients', 'me', 'routine'],
  });
}
