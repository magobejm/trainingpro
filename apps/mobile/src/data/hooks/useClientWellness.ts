import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useClientWellnessQuery(dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchWellness(auth, dateFrom, dateTo),
    queryKey: ['clients', 'me', 'wellness', dateFrom, dateTo],
  });
}

async function fetchWellness(
  auth: ReturnType<typeof useAuth>,
  dateFrom: string,
  dateTo: string,
): Promise<ClientWellnessResponse> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientWellnessResponse>(`/clients/me/wellness?dateFrom=${dateFrom}&dateTo=${dateTo}`);
}

export type AdherenceSummary = { percent: null | number };
export type TrainingAdherence = AdherenceSummary & { assigned: boolean };

export function useMyTrainingAdherenceQuery(from: string, to: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).get<TrainingAdherence>(`/progress/adherence?from=${from}&to=${to}`);
    },
    queryKey: ['clients', 'me', 'adherence', 'training', from, to],
  });
}

export function useMyNutritionAdherenceQuery(from: string, to: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).get<{ assigned: boolean; summary: AdherenceSummary }>(
        `/clients/me/nutrition/adherence?from=${from}&to=${to}`,
      );
    },
    queryKey: ['clients', 'me', 'adherence', 'nutrition', from, to],
  });
}

export function useSaveWeeklyLoadMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; weekStartDate: string }) => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).put<{ saved: boolean }>('/clients/me/weekly-load', input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'wellness'] });
    },
  });
}
