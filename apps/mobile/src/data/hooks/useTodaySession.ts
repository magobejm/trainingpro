import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type SessionView = {
  id: string;
  items: { id: string; displayName: string; setsPlanned: null | number }[];
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

export function useLogSetMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { repsDone: null | number; sessionItemId: string; setIndex: number }) =>
      logSet(auth, sessionId, input),
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

async function logSet(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
  input: { repsDone: null | number; sessionItemId: string; setIndex: number },
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post(`/sessions/strength/${sessionId}/log-set`, input);
}

async function mutateSession(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
  action: 'finish' | 'start',
) {
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

async function readSession(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
): Promise<SessionView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const path = `/sessions/strength/${sessionId}`;
  return createApiClient(auth).get<SessionView>(path);
}
