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

export type PlioSetLog = {
  effortRpe: null | number;
  repsDone: null | number;
  sessionPlioBlockId: string;
  setIndex: number;
  weightDoneKg: null | number;
};

export type PlioSessionItem = {
  type: 'plio';
  id: string;
  displayName: string;
  logs: PlioSetLog[];
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe: null | number;
  workSeconds: number;
};

export type MobilitySetLog = {
  effortRpe: null | number;
  repsDone: null | number;
  romDone: null | string;
  sessionMobilityBlockId: string;
  setIndex: number;
};

export type MobilitySessionItem = {
  type: 'mobility';
  id: string;
  displayName: string;
  logs: MobilitySetLog[];
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe: null | number;
  workSeconds: number;
};

export type IsometricSetLog = {
  durationSecondsDone: null | number;
  effortRpe: null | number;
  sessionIsometricBlockId: string;
  setIndex: number;
  weightDoneKg: null | number;
};

export type IsometricSessionItem = {
  type: 'isometric';
  id: string;
  displayName: string;
  logs: IsometricSetLog[];
  restSeconds: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  targetRpe: null | number;
};

export type SportLog = {
  avgHeartRate: null | number;
  durationMinutesDone: null | number;
  effortRpe: null | number;
  sessionSportBlockId: string;
};

export type SportSessionItem = {
  type: 'sport';
  id: string;
  displayName: string;
  durationMinutes: number;
  log: SportLog | null;
  sortOrder: number;
  targetRpe: null | number;
};

export type IntervalLog = {
  avgHeartRate: null | number;
  distanceDoneMeters: null | number;
  durationSecondsDone: null | number;
  effortRpe: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
};

export type CardioSessionItem = {
  type: 'cardio';
  id: string;
  displayName: string;
  intervalLogs: IntervalLog[];
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters: null | number;
  targetRpe: null | number;
  workSeconds: number;
};

export type SessionItem =
  | CardioSessionItem
  | IsometricSessionItem
  | MobilitySessionItem
  | PlioSessionItem
  | SportSessionItem
  | StrengthSessionItem;

export type LogPlioSetMutationInput = {
  effortRpe?: null | number;
  repsDone?: null | number;
  sessionPlioBlockId: string;
  setIndex: number;
  weightDoneKg?: null | number;
};

export type LogMobilitySetMutationInput = {
  effortRpe?: null | number;
  repsDone?: null | number;
  romDone?: null | string;
  sessionMobilityBlockId: string;
  setIndex: number;
};

export type LogIsometricSetMutationInput = {
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  sessionIsometricBlockId: string;
  setIndex: number;
  weightDoneKg?: null | number;
};

export type LogSportMutationInput = {
  avgHeartRate?: null | number;
  durationMinutesDone?: null | number;
  effortRpe?: null | number;
  sessionSportBlockId: string;
};

export type LogIntervalMutationInput = {
  avgHeartRate?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
};

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

export function useLogPlioSetMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogPlioSetMutationInput) => logPlioSet(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useLogMobilitySetMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogMobilitySetMutationInput) => logMobilitySet(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useLogIsometricSetMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogIsometricSetMutationInput) => logIsometricSet(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useLogSportMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogSportMutationInput) => logSport(auth, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useLogIntervalMutation(sessionId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogIntervalMutationInput) => logInterval(auth, sessionId, input),
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
  return createApiClient(auth).post(`/sessions/${sessionId}/log-set`, input);
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
  return createApiClient(auth).post(`/sessions/${sessionId}/start`, payload);
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
  return createApiClient(auth).post(`/sessions/${sessionId}/finish`, payload);
}

async function readSession(auth: ReturnType<typeof useAuth>, sessionId: string): Promise<SessionView> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<SessionView>(`/sessions/${sessionId}`);
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

async function logPlioSet(auth: ReturnType<typeof useAuth>, sessionId: string, input: LogPlioSetMutationInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post(`/sessions/${sessionId}/log-plio-set`, input);
}

async function logMobilitySet(auth: ReturnType<typeof useAuth>, sessionId: string, input: LogMobilitySetMutationInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post(`/sessions/${sessionId}/log-mobility-set`, input);
}

async function logIsometricSet(auth: ReturnType<typeof useAuth>, sessionId: string, input: LogIsometricSetMutationInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post(`/sessions/${sessionId}/log-isometric-set`, input);
}

async function logSport(auth: ReturnType<typeof useAuth>, sessionId: string, input: LogSportMutationInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post(`/sessions/${sessionId}/log-sport`, input);
}

async function logInterval(auth: ReturnType<typeof useAuth>, sessionId: string, input: LogIntervalMutationInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post(`/sessions/${sessionId}/log-interval`, input);
}
