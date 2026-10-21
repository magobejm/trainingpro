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
  totalReps: number | null;
  totalSets: number;
  volumeKg: number | null;
  weekStart: string;
  metricCoverage?: Record<string, { validSamples: number; eligibleSamples: number; unit: string; weightSeconds?: number }>;
};

export type CardioWeeklyPoint = {
  avgHeartRate: null | number;
  avgRpe: null | number;
  methodType: string;
  totalDistanceMeters: number | null;
  totalDurationSeconds: number | null;
  weekStart: string;
  metricCoverage?: Record<string, { validSamples: number; eligibleSamples: number; unit: string; weightSeconds?: number }>;
};

export type SrpeWeeklyPoint = {
  totalSrpe: number | null;
  weekStart: string;
  metricCoverage?: Record<string, { validSamples: number; eligibleSamples: number; unit: string; weightSeconds?: number }>;
};

type QueryInput = {
  clientId?: string;
  from: string;
  to: string;
};

type Options = {
  enabled?: boolean;
};

export function useProgressOverviewQuery(input: QueryInput, options?: Options): UseQueryResult<ProgressOverviewView, Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && (options?.enabled ?? true),
    queryFn: () => fetchProgressOverview(auth, input),
    queryKey: ['progress', 'overview', input.clientId, input.from, input.to, auth?.activeRole],
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

async function fetchProgressOverview(auth: ReturnType<typeof useAuth>, input: QueryInput): Promise<ProgressOverviewView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const query = new URLSearchParams({ from: input.from, to: input.to });
  if (input.clientId) {
    query.set('clientId', input.clientId);
  }
  return createApiClient(auth).get<ProgressOverviewView>(`/progress/overview?${query}`);
}
