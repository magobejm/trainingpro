import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type TestInputs = {
  gender: 'F' | 'M';
  age: number;
  weight?: number;
  timeMin?: number;
  timeSec?: number;
  hr?: number;
  distance?: number;
  reps?: number;
  palier?: number;
  workload?: number;
  eyesClosed?: boolean;
  level?: 'Avanzado' | 'Recreacional';
};

export type PhysicalTestView = {
  id: string;
  code: string;
  category: string;
  name: string;
  level: string;
  objective: string;
  whatToDo: string;
  whatToMeasure: string;
  options: {
    economic: string;
    pro: string;
  } | null;
  normTables?: unknown;
  sortOrder: number;
};

export type PhysicalTestResultView = {
  id: string;
  clientId: string;
  physicalTestId: string;
  inputsJson: TestInputs;
  rawScore: string;
  classification: string;
  classificationColor: string | null;
  measuredAt: string;
};

export type PhysicalTestScheduleSummary = {
  done: boolean;
  id: string;
  resultId: string | null;
  scheduledDate: string;
};

export type ClientPhysicalTestAssignmentView = {
  id: string;
  clientId: string;
  physicalTestId: string;
  assignedAt: string;
  physicalTest: PhysicalTestView;
  latestResult: PhysicalTestResultView | null;
  results: PhysicalTestResultView[];
  schedules: PhysicalTestScheduleSummary[];
};

export function usePhysicalTestsCatalogQuery(): UseQueryResult<PhysicalTestView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchCatalog(auth),
    queryKey: ['physical-tests', 'catalog', auth?.activeRole, auth?.accessToken],
  });
}

export function useClientPhysicalTestsQuery(clientId: string): UseQueryResult<ClientPhysicalTestAssignmentView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => fetchClientAssignments(auth, clientId),
    queryKey: ['physical-tests', 'client', clientId, auth?.activeRole, auth?.accessToken],
  });
}

export function useAssignPhysicalTestMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => assignTest(auth, clientId, testId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['physical-tests', 'client', clientId] });
    },
  });
}

export function useSchedulePhysicalTestMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; physicalTestId: string; replace?: boolean }) => scheduleTest(auth, clientId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['physical-tests', 'client', clientId] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useArchivePhysicalTestScheduleMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { clientId: string; scheduleId: string }) => archiveSchedule(auth, input.clientId, input.scheduleId),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['physical-tests', 'client', input.clientId] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUnassignPhysicalTestMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => unassignTest(auth, clientId, testId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['physical-tests', 'client', clientId] });
    },
  });
}

export function useRecordPhysicalTestResultMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { testId: string; inputs: TestInputs }) => recordResult(auth, clientId, args.testId, args.inputs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['physical-tests', 'client', clientId] });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchCatalog(auth: ReturnType<typeof useAuth>): Promise<PhysicalTestView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<PhysicalTestView[]>('/physical-tests');
}

async function fetchClientAssignments(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
): Promise<ClientPhysicalTestAssignmentView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientPhysicalTestAssignmentView[]>(`/clients/${clientId}/physical-tests`);
}

async function assignTest(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  testId: string,
): Promise<ClientPhysicalTestAssignmentView> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post<ClientPhysicalTestAssignmentView>(`/clients/${clientId}/physical-tests/${testId}`, {});
}

async function scheduleTest(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  input: { date: string; physicalTestId: string; replace?: boolean },
): Promise<void> {
  if (!auth) throw new Error('Missing authenticated context');
  await createApiClient(auth).post(`/clients/${clientId}/physical-test-schedules`, input);
}

async function archiveSchedule(auth: ReturnType<typeof useAuth>, clientId: string, scheduleId: string): Promise<void> {
  if (!auth) throw new Error('Missing authenticated context');
  await createApiClient(auth).delete(`/clients/${clientId}/physical-test-schedules/${scheduleId}`);
}

async function unassignTest(auth: ReturnType<typeof useAuth>, clientId: string, testId: string): Promise<void> {
  if (!auth) throw new Error('Missing authenticated context');
  await createApiClient(auth).delete(`/clients/${clientId}/physical-tests/${testId}`);
}

async function recordResult(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  testId: string,
  inputs: TestInputs,
): Promise<PhysicalTestResultView> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post<PhysicalTestResultView>(`/clients/${clientId}/physical-tests/${testId}/results`, inputs);
}
