import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CreateClientInput = {
  birthDate?: null | string;
  email: string;
  firstName: string;
  heightCm?: null | number;
  lastName: string;
  notes?: null | string;
  objective?: null | string;
  phone?: null | string;
  sex?: null | string;
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
): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  await createApiClient(auth).post('/clients', input);
}
