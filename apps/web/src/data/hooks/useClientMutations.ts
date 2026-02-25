import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CreateClientInput = {
  avatarUrl?: null | string;
  birthDate?: null | string;
  email: string;
  firstName: string;
  heightCm?: null | number;
  lastName: string;
  notes?: null | string;
  objectiveId?: null | string;
  phone?: null | string;
  sex?: null | string;
  weightKg?: null | number;
};

export type UpdateClientInput = Partial<CreateClientInput> & {
  trainingPlanId?: string | null;
};

export type CreateClientResult = {
  client: {
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  };
  credentials: {
    temporaryPassword: null | string;
    userCreated: boolean;
  };
};

export function useCreateClientMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => createClient(auth, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClientMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClientInput) => updateClient(auth, clientId, input),
    onSuccess: (_, input) => {
      syncClientInCache(queryClient, clientId, input);
      if (typeof input.avatarUrl === 'string') {
        syncAvatarInCache(queryClient, clientId, input.avatarUrl);
      }
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['clients', 'detail', clientId] });
    },
  });
}

export function useArchiveClientMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => archiveClient(auth, clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useResetClientPasswordMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (clientId: string) => resetClientPassword(auth, clientId),
  });
}

export function useUploadClientAvatarMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(auth, clientId, file),
    onSuccess: (result) => {
      syncAvatarInCache(queryClient, clientId, result.avatarUrl);
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['clients', 'detail', clientId] });
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

async function archiveClient(auth: ReturnType<typeof useAuth>, clientId: string): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  await createApiClient(auth).delete<{ status: string }>(`/clients/${clientId}`);
}

async function createClient(
  auth: ReturnType<typeof useAuth>,
  input: CreateClientInput,
): Promise<CreateClientResult> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<CreateClientResult>('/clients', input);
}

async function updateClient(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  input: UpdateClientInput,
): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  await createApiClient(auth).patch(`/clients/${clientId}`, input);
}

async function uploadAvatar(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  file: File,
): Promise<{ avatarUrl: string }> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${resolveApiBaseUrl()}/clients/${clientId}/avatar`, {
    body: form,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Active-Role': auth.activeRole,
    },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Avatar upload failed');
  }
  return (await response.json()) as { avatarUrl: string };
}

async function resetClientPassword(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
): Promise<{ temporaryPassword: string }> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<{ temporaryPassword: string }>(
    `/clients/${clientId}/reset-password`,
  );
}

function syncAvatarInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
  avatarUrl: string,
): void {
  updateDetailAvatar(queryClient, clientId, avatarUrl);
  updateListAvatar(queryClient, clientId, avatarUrl);
}

function syncClientInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
  input: UpdateClientInput,
): void {
  queryClient.setQueriesData({ queryKey: ['clients', 'detail', clientId] }, (previous) => {
    if (!isObject(previous)) {
      return previous;
    }
    return { ...previous, ...input };
  });
}

function updateDetailAvatar(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
  avatarUrl: string,
): void {
  queryClient.setQueriesData({ queryKey: ['clients', 'detail', clientId] }, (previous) => {
    if (!isObject(previous)) {
      return previous;
    }
    return { ...previous, avatarUrl };
  });
}

function updateListAvatar(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
  avatarUrl: string,
): void {
  queryClient.setQueriesData({ queryKey: ['clients', 'list'] }, (previous) => {
    if (!Array.isArray(previous)) {
      return previous;
    }
    return previous.map((item) => updateListItemAvatar(item, clientId, avatarUrl));
  });
}

function updateListItemAvatar(item: unknown, clientId: string, avatarUrl: string): unknown {
  if (!isObject(item) || item.id !== clientId) {
    return item;
  }
  return { ...item, avatarUrl };
}

function isObject(value: unknown): value is { avatarUrl?: string; id?: string } {
  return typeof value === 'object' && value !== null;
}

function resolveApiBaseUrl(): string {
  const scope = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  const processEnv = scope.process?.env ?? {};
  const metaEnv =
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  return (
    metaEnv.EXPO_PUBLIC_API_BASE_URL ??
    processEnv.EXPO_PUBLIC_API_BASE_URL ??
    'http://localhost:8080'
  );
}
