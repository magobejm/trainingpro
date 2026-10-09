import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type PhysicalTestView = {
  category: string;
  code: string;
  id: string;
  level: string;
  name: string;
  objective: string;
  options: { economic: string; pro: string } | null;
  sortOrder: number;
  whatToDo: string;
  whatToMeasure: string;
};

export type PhysicalTestResultView = {
  classification: string;
  classificationColor: null | string;
  clientId: string;
  id: string;
  inputsJson: RecordPhysicalTestInput;
  measuredAt: string;
  physicalTestId: string;
  rawScore: string;
};

export type ClientPhysicalTestAssignment = {
  assignedAt: string;
  clientId: string;
  id: string;
  latestResult: PhysicalTestResultView | null;
  physicalTest: PhysicalTestView;
  physicalTestId: string;
  results: PhysicalTestResultView[];
};

export type RecordPhysicalTestInput = {
  age: number;
  distance?: number;
  eyesClosed?: boolean;
  gender: 'F' | 'M';
  hr?: number;
  level?: 'Avanzado' | 'Recreacional';
  palier?: number;
  reps?: number;
  timeMin?: number;
  timeSec?: number;
  weight?: number;
  workload?: number;
};

export type ClientPhysicalTestSchedule = {
  id: string;
  physicalTest: PhysicalTestView;
  result: PhysicalTestResultView | null;
  scheduledDate: string;
};

const PHYSICAL_TESTS_KEY = ['clients', 'me', 'physical-tests'] as const;
const SCHEDULES_KEY = ['clients', 'me', 'physical-test-schedules'] as const;

export function useClientPhysicalTestsQuery(): UseQueryResult<ClientPhysicalTestAssignment[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchPhysicalTests(auth),
    queryKey: PHYSICAL_TESTS_KEY,
  });
}

export function usePhysicalTestSchedulesQuery(dateFrom: string, dateTo: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(dateFrom) && Boolean(dateTo),
    queryFn: () => fetchSchedules(auth, dateFrom, dateTo),
    queryKey: [...SCHEDULES_KEY, dateFrom, dateTo],
  });
}

export function useRecordPhysicalTestResultMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, scheduleId, testId }: { input: RecordPhysicalTestInput; scheduleId?: string; testId: string }) =>
      recordPhysicalTestResult(auth, testId, input, scheduleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PHYSICAL_TESTS_KEY });
      void queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] });
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

async function fetchPhysicalTests(auth: ReturnType<typeof useAuth>): Promise<ClientPhysicalTestAssignment[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientPhysicalTestAssignment[]>('/clients/me/physical-tests');
}

async function fetchSchedules(
  auth: ReturnType<typeof useAuth>,
  dateFrom: string,
  dateTo: string,
): Promise<ClientPhysicalTestSchedule[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientPhysicalTestSchedule[]>(
    `/clients/me/physical-test-schedules?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

async function recordPhysicalTestResult(
  auth: ReturnType<typeof useAuth>,
  testId: string,
  input: RecordPhysicalTestInput,
  scheduleId?: string,
): Promise<PhysicalTestResultView> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post<PhysicalTestResultView>(`/clients/me/physical-tests/${testId}/results`, {
    ...input,
    ...(scheduleId ? { scheduleId } : {}),
  });
}
