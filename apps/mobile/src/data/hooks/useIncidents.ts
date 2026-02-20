import { useMutation } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CreateIncidentInput = {
  description: string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
};

export function useCreateIncidentMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (input: CreateIncidentInput) => createIncident(auth, input),
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

async function createIncident(auth: ReturnType<typeof useAuth>, input: CreateIncidentInput) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post('/incidents', input);
}
