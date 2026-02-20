import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type CardioSessionView = {
  blocks: {
    displayName: string;
    id: string;
    restSeconds: number;
    roundsPlanned: number;
    targetDistanceMeters: null | number;
    targetRpe: null | number;
    workSeconds: number;
  }[];
  id: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
};

type LogIntervalInput = {
  avgHeartRate?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
};

export function useCardioSessionQuery(sessionId: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && sessionId.length > 0,
    queryFn: () => readSession(auth, sessionId),
    queryKey: ['cardio-session', sessionId, auth?.activeRole, auth?.accessToken],
  });
}

export function useStartCardioSessionMutation(sessionId: string) {
  return useCardioMutation(sessionId, 'start');
}

export function useFinishCardioSessionMutation(sessionId: string) {
  return useCardioMutation(sessionId, 'finish');
}

export function useLogIntervalMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogIntervalInput) => logInterval(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cardio-session', sessionId] });
    },
  });
}

function useCardioMutation(sessionId: string, action: 'finish' | 'start') {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mutateSession(auth, sessionId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cardio-session', sessionId] });
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

async function logInterval(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
  input: LogIntervalInput,
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post(`/sessions/cardio/${sessionId}/log-interval`, input);
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
    return createApiClient(auth).post(`/sessions/cardio/${sessionId}/start`, {});
  }
  return createApiClient(auth).post(`/sessions/cardio/${sessionId}/finish`, {
    isIncomplete: false,
  });
}

async function readSession(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
): Promise<CardioSessionView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<CardioSessionView>(`/sessions/cardio/${sessionId}`);
}
