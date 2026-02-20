import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ProgressOverviewView = {
  cardioWeekly: CardioWeeklyPoint[];
  srpeWeekly: SrpeWeeklyPoint[];
  strengthWeekly: StrengthWeeklyPoint[];
};

export type StrengthWeeklyPoint = {
  maxWeightKg: null | number;
  muscleGroup: string;
  totalReps: number;
  totalSets: number;
  volumeKg: number;
  weekStart: string;
};

export type CardioWeeklyPoint = {
  avgHeartRate: null | number;
  avgRpe: null | number;
  methodType: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  weekStart: string;
};

export type SrpeWeeklyPoint = {
  totalSrpe: number;
  weekStart: string;
};

type QueryInput = {
  from: string;
  to: string;
};

export function useProgressOverviewQuery(
  input: QueryInput,
): UseQueryResult<ProgressOverviewView, Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchProgressOverview(auth, input),
    queryKey: ['progress', 'overview', input.from, input.to, auth?.activeRole],
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

async function fetchProgressOverview(
  auth: ReturnType<typeof useAuth>,
  input: QueryInput,
): Promise<ProgressOverviewView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const query = new URLSearchParams({ from: input.from, to: input.to });
  return createApiClient(auth).get<ProgressOverviewView>(`/progress/overview?${query}`);
}
