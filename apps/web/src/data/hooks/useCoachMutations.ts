import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export function useArchiveCoachMutation() {
  return useCoachMutation((auth, coachMembershipId) =>
    createApiClient(auth).delete(`/coaches/${coachMembershipId}`),
  );
}

export function useToggleCoachMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { coachMembershipId: string; isActive: boolean }) =>
      toggleCoach(auth, input.coachMembershipId, input.isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

function useCoachMutation(
  run: (auth: AuthState, coachMembershipId: string) => Promise<unknown>,
) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coachMembershipId: string) => run(auth, coachMembershipId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

type AuthState = {
  accessToken: string;
  activeRole: 'admin' | 'client' | 'coach';
};

function useAuth(): AuthState {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    throw new Error('Missing authenticated context');
  }
  return { accessToken, activeRole };
}

async function toggleCoach(
  auth: AuthState,
  coachMembershipId: string,
  isActive: boolean,
): Promise<void> {
  const action = isActive ? 'deactivate' : 'activate';
  await createApiClient(auth).patch(`/coaches/${coachMembershipId}/${action}`);
}
