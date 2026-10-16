import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';
import { refreshCalendarOnSkipConflict } from '../client-session-skip-error';

export type ClientCalendarEvent = {
  id: string;
  type: 'call' | 'client_note' | 'note' | 'physical_test' | 'reminder' | 'workout';
  date: string;
  title: string | null;
  content: string | null;
  time: string | null;
  callStatus?: 'accepted' | 'pending';
  color: string | null;
  initiatedBy?: 'CLIENT' | 'COACH';
  isCompleted?: boolean;
  lastProposedBy?: 'CLIENT' | 'COACH';
  outcome?: 'done' | 'incomplete' | 'in_progress' | 'pending' | 'skipped';
  sessionId?: string | null;
  skipReason?: string | null;
  originDate?: string | null;
  planDayId: string | null;
  planDayTitle: string | undefined;
  proposalId?: string;
  scheduleId?: string;
};

export type ClientSessionSummary = {
  id: string;
  sessionDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  isCompleted: boolean;
  isIncomplete: boolean;
  outcome?: 'done' | 'incomplete' | 'in_progress' | 'pending' | 'skipped';
  skipReason?: string | null;
  skippedAt?: string | null;
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

export function useSkipClientSessionMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planDayId: string; reason?: string; sessionDate: string }) => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).post('/clients/me/sessions/skip', input, {
        'x-timezone-offset': String(new Date().getTimezoneOffset()),
      });
    },
    onSuccess: () => invalidateCalendar(queryClient),
    onError: (error) => refreshCalendarOnSkipConflict(error, () => invalidateCalendar(queryClient)),
  });
}

export function useUndoSkipClientSessionMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).delete(`/clients/me/sessions/${sessionId}/skip`);
    },
    onSuccess: () => invalidateCalendar(queryClient),
    onError: (error) => refreshCalendarOnSkipConflict(error, () => invalidateCalendar(queryClient)),
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

export function useCancelCallProposalMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => {
      if (!auth) throw new Error('Missing authenticated context');
      return createApiClient(auth).post(`/calls/proposals/${proposalId}/cancel`, {});
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

function invalidateCalendar(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] });
  void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'sessions'] });
  void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar-summary'] });
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
