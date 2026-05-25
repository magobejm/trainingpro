import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';

export type ClientWellnessSession = {
  id: string;
  isCompleted: boolean;
  planDayTitle: null | string;
  postFatigue: null | number;
  postMood: null | number;
  postPain: null | number;
  preFatigue: null | number;
  preMotivation: null | number;
  preRecovery: null | number;
  sessionDate: string;
};

export type ClientWellnessWeeklyReport = {
  adherencePercent: null | number;
  energy: null | number;
  id: string;
  mood: null | number;
  reportDate: string;
  sleepHours: null | number;
  weekStartDate: string;
};

export type ClientWellnessSummary = {
  avgPostFatigue: null | number;
  avgPostMood: null | number;
  avgPreMotivation: null | number;
  reportsCount: number;
  sessionsWithWellness: number;
};

export type ClientWellnessResponse = {
  sessions: ClientWellnessSession[];
  summary: ClientWellnessSummary;
  weeklyReports: ClientWellnessWeeklyReport[];
};

export function useClientWellnessQuery(dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchWellness(auth, dateFrom, dateTo),
    queryKey: ['clients', 'me', 'wellness', dateFrom, dateTo],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchWellness(
  auth: ReturnType<typeof useAuth>,
  dateFrom: string,
  dateTo: string,
): Promise<ClientWellnessResponse> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientWellnessResponse>(`/clients/me/wellness?dateFrom=${dateFrom}&dateTo=${dateTo}`);
}
