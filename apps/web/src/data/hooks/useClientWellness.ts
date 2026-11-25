import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-api-auth';
import { createApiClient } from '../api-client';

export type ClientWellnessSession = {
  finishComment: null | string;
  finishedAt: null | string;
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
  sessionRpe: null | number;
};

export type ClientWellnessCheckin = { date: string; motivation: number; recovery: number; sleep: number };

export type ClientWellnessWeeklyLoad = { content: string; id: string; updatedAt: string; weekStartDate: string };

export type ClientWellnessWeeklyReport = {
  adherencePercent: null | number;
  energy: null | number;
  id: string;
  mood: null | number;
  notes?: null | string;
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
  checkins: ClientWellnessCheckin[];
  sessions: ClientWellnessSession[];
  summary: ClientWellnessSummary;
  weeklyLoads: ClientWellnessWeeklyLoad[];
  weeklyReports: ClientWellnessWeeklyReport[];
};

export function useClientWellnessQuery(clientId: string, dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => fetchWellness(auth, clientId, dateFrom, dateTo),
    queryKey: ['clients', clientId, 'wellness', dateFrom, dateTo],
  });
}

async function fetchWellness(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ClientWellnessResponse> {
  if (!auth) throw new Error('Missing authenticated context');
  const query = new URLSearchParams({ dateFrom, dateTo });
  return createApiClient(auth).get<ClientWellnessResponse>(`/clients/${clientId}/wellness?${query.toString()}`);
}
