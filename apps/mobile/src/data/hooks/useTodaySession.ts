import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type SetLog = {
  effortRir: null | number;
  effortRpe: null | number;
  repsDone: null | number;
  sessionItemId: string;
  setIndex: number;
  weightDoneKg: null | number;
};

export type StrengthSessionItem = {
  type: 'strength';
  id: string;
  displayName: string;
  logs: SetLog[];
  notes: null | string;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  sourceExerciseId: null | string;
  targetRir: null | number;
  targetRpe: null | number;
  weightRangeMaxKg: null | number;
  weightRangeMinKg: null | number;
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
  postFatigue: null | number;
  postMood: null | number;
  postPain: null | number;
  preFatigue: null | number;
  preMotivation: null | number;
  preRecovery: null | number;
  startedAt: null | string;
  startMode: 'INTERACTIVE' | 'TIMER' | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
};

export type ExerciseHistoryEntry = {
  effortRir: null | number;
  effortRpe: null | number;
  repsDone: null | number;
  sessionDate: string;
  weightDoneKg: null | number;
};

export type LogSetMutationInput = {
  effortRir?: null | number;
  effortRpe?: null | number;
  repsDone?: null | number;
  sessionItemId: string;
  setIndex: number;
  weightDoneKg?: null | number;
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
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      preFatigue?: null | number;
      preMotivation?: null | number;
      preRecovery?: null | number;
      startMode?: 'INTERACTIVE' | 'TIMER' | null;
    }) => startSession(auth, sessionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useFinishSessionMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      comment?: null | string;
      isIncomplete: boolean;
      postFatigue?: null | number;
      postMood?: null | number;
      postPain?: null | number;
    }) => finishSession(auth, sessionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
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
    mutationFn: (input: LogSetMutationInput) => logSet(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useExerciseHistoryQuery(sourceExerciseId: null | string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(sourceExerciseId),
    queryFn: () => fetchExerciseHistory(auth, sourceExerciseId!),
    queryKey: ['exerciseHistory', sourceExerciseId, auth?.accessToken],
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

async function logSet(auth: ReturnType<typeof useAuth>, sessionId: string, input: LogSetMutationInput) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post(`/sessions/strength/${sessionId}/log-set`, input);
}

async function startSession(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
  payload: {
    preFatigue?: null | number;
    preMotivation?: null | number;
    preRecovery?: null | number;
    startMode?: 'INTERACTIVE' | 'TIMER' | null;
  },
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post(`/sessions/strength/${sessionId}/start`, payload);
}

async function finishSession(
  auth: ReturnType<typeof useAuth>,
  sessionId: string,
  payload: {
    comment?: null | string;
    isIncomplete: boolean;
    postFatigue?: null | number;
    postMood?: null | number;
    postPain?: null | number;
  },
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post(`/sessions/strength/${sessionId}/finish`, payload);
}

async function readSession(auth: ReturnType<typeof useAuth>, sessionId: string): Promise<SessionView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const path = `/sessions/strength/${sessionId}`;
  return createApiClient(auth).get<SessionView>(path);
}

async function fetchExerciseHistory(
  auth: ReturnType<typeof useAuth>,
  sourceExerciseId: string,
): Promise<ExerciseHistoryEntry[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<ExerciseHistoryEntry[]>(`/clients/me/exercises/${sourceExerciseId}/history?limit=3`);
}
