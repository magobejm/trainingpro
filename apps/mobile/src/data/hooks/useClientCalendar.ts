import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';

export type ClientCalendarEvent = {
  id: string;
  type: 'call' | 'client_note' | 'note' | 'physical_test' | 'reminder' | 'workout';
  date: string;
  title: string | null;
  content: string | null;
  time: string | null;
  color: string | null;
  isCompleted?: boolean;
  originDate?: string | null;
  planDayId: string | null;
  planDayTitle: string | undefined;
  scheduleId?: string;
};

export type ClientSessionSummary = {
  id: string;
  sessionDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  isCompleted: boolean;
  isIncomplete: boolean;
  planDayId: string | null;
  planDayIndex: number | null;
  planDayTitle: string | null;
  preMotivation: number | null;
  postMood: number | null;
  postFatigue: number | null;
  postPain: number | null;
};

export type ClientCalendarSummary = {
  completedDays: number;
  currentStreakWeeks: number;
  avgMotivation: number | null;
};

export function useClientCalendarEventsQuery(dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchCalendarEvents(auth, dateFrom, dateTo),
    queryKey: ['clients', 'me', 'calendar', dateFrom, dateTo],
  });
}

export function useClientCalendarSessionsQuery(dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchCalendarSessions(auth, dateFrom, dateTo),
    queryKey: ['clients', 'me', 'sessions', dateFrom, dateTo],
  });
}

export function useClientCalendarSummaryQuery(dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchCalendarSummary(auth, dateFrom, dateTo),
    queryKey: ['clients', 'me', 'calendar-summary', dateFrom, dateTo],
  });
}

export function useSaveClientDayNoteMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; date: string }) => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).put(`/clients/me/calendar/notes/${input.date}`, { content: input.content });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] });
    },
  });
}

export function useCreateCallProposalMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; time: string }) => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).post('/calls/proposals', input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchCalendarEvents(
  auth: ReturnType<typeof useAuth>,
  dateFrom: string,
  dateTo: string,
): Promise<{ data: ClientCalendarEvent[] }> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<{ data: ClientCalendarEvent[] }>(
    `/clients/me/calendar?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

async function fetchCalendarSessions(
  auth: ReturnType<typeof useAuth>,
  dateFrom: string,
  dateTo: string,
): Promise<ClientSessionSummary[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientSessionSummary[]>(`/clients/me/sessions?dateFrom=${dateFrom}&dateTo=${dateTo}`);
}

async function fetchCalendarSummary(
  auth: ReturnType<typeof useAuth>,
  dateFrom: string,
  dateTo: string,
): Promise<ClientCalendarSummary> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientCalendarSummary>(
    `/clients/me/calendar-summary?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}
