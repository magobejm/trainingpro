import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';
import { subscribeOnboardingRefresh, type CoachOnboarding } from '../onboarding';

function useOnboardingAuth() {
  const token = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.activeRole);
  return { token, role, queryKey: ['coach', 'onboarding', token, role] as const };
}

export function useOnboarding() {
  const { token, role, queryKey } = useOnboardingAuth();
  return useQuery({
    queryKey,
    enabled: Boolean(token && role === 'coach'),
    queryFn: () =>
      createApiClient({ accessToken: token!, activeRole: 'coach' }).get<CoachOnboarding>('/coaches/me/onboarding'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useSaveOnboarding() {
  const { token, queryKey } = useOnboardingAuth();
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['coach', 'onboarding', 'save'],
    mutationFn: (hidden: boolean) =>
      createApiClient({ accessToken: token!, activeRole: 'coach' }).patch<CoachOnboarding>('/coaches/me/onboarding', {
        hidden,
      }),
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
    },
  });
}

/** Mounted once by the user panel; refresh real progress after successful app actions. */
export function useRefreshOnboardingAfterMutation() {
  const client = useQueryClient();
  const role = useAuthStore((state) => state.activeRole);
  useEffect(() => {
    if (role !== 'coach') return;
    return subscribeOnboardingRefresh(client);
  }, [client, role]);
}
