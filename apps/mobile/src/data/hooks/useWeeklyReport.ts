import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type WeeklyReportView = {
  adherencePercent: null | number;
  energy: null | number;
  id: string;
  mood: null | number;
  notes: null | string;
  reportDate: string;
  sleepHours: null | number;
  sourceSessionId: null | string;
  weekStartDate: string;
};

export type UpsertWeeklyReportInput = {
  adherencePercent?: null | number;
  energy?: null | number;
  mood?: null | number;
  notes?: null | string;
  reportDate: string;
  sleepHours?: null | number;
  sourceSessionId?: null | string;
};

export function useWeeklyReportQuery(reportDate: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchWeeklyReport(auth, reportDate),
    queryKey: ['weekly-report', reportDate, auth?.activeRole],
  });
}

export function useUpsertWeeklyReportMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertWeeklyReportInput) => upsertWeeklyReport(auth, input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['weekly-report', variables.reportDate] });
    },
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

async function fetchWeeklyReport(auth: ReturnType<typeof useAuth>, reportDate: string) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const query = new URLSearchParams({ reportDate });
  return createApiClient(auth).get<null | WeeklyReportView>(`/reports/weekly?${query}`);
}

async function upsertWeeklyReport(
  auth: ReturnType<typeof useAuth>,
  input: UpsertWeeklyReportInput,
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<WeeklyReportView>('/reports/weekly', input);
}
