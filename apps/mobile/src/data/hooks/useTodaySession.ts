import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type StrengthSessionItem = {
  type: 'strength';
  id: string;
  displayName: string;
  setsPlanned: null | number;
  repsMax: null | number;
  repsMin: null | number;
  logs: {
    effortRpe: null | number;
    repsDone: null | number;
    sessionItemId: string;
    setIndex: number;
    weightDoneKg: null | number;
  }[];
  sortOrder: number;
};

export type BlockSessionItem = {
  type: 'isometric' | 'mobility' | 'plio' | 'sport';
  id: string;
  displayName: string;
  meta: string;
  sortOrder: number;
};

export type SessionItem = BlockSessionItem | StrengthSessionItem;

export type SessionView = {
  id: string;
  items: SessionItem[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
};

export function useSessionQuery(sessionId: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && sessionId.length > 0,
    queryFn: () => readSession(auth, sessionId),
    queryKey: ['session', sessionId, auth?.activeRole, auth?.accessToken],
  });
}

export function useStartSessionMutation(sessionId: string) {
  return useSessionMutation(sessionId, 'start');
}

export function useFinishSessionMutation(sessionId: string) {
  return useSessionMutation(sessionId, 'finish');
}

export type EnsureClientSessionResult = {
  id: string;
  sessionDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
};

export function useEnsureClientSessionMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (input: { sessionDate: string; planDayId?: string }) => ensureClientSession(auth, input),
  });
}

export function useLogSetMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      effortRpe: null | number;
      repsDone: null | number;
      sessionItemId: string;
      setIndex: number;
      weightDoneKg: null | number;
    }) => logSet(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

function useSessionMutation(sessionId: string, action: 'finish' | 'start') {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mutateSession(auth, sessionId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
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

async function ensureClientSession(
  auth: ReturnType<typeof useAuth>,
  input: { sessionDate: string; planDayId?: string },
): Promise<EnsureClientSessionResult> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<EnsureClientSessionResult>('/clients/me/sessions/ensure', input);
}

async function logSet(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
  input: {
    effortRpe: null | number;
    repsDone: null | number;
    sessionItemId: string;
    setIndex: number;
    weightDoneKg: null | number;
  },
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post(`/sessions/strength/${sessionId}/log-set`, input);
}

async function mutateSession(auth: ReturnType<typeof useAuth>, sessionId: string, action: 'finish' | 'start') {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  if (action === 'start') {
    return createApiClient(auth).post(`/sessions/strength/${sessionId}/start`, {});
  }
  return createApiClient(auth).post(`/sessions/strength/${sessionId}/finish`, {
    isIncomplete: false,
  });
}

async function readSession(auth: ReturnType<typeof useAuth>, sessionId: string): Promise<SessionView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const path = `/sessions/strength/${sessionId}`;
  return createApiClient(auth).get<SessionView>(path);
}
