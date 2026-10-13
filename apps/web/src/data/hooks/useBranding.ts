import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BrandAccent } from '@trainerpro/ui';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';
import { brandingRefreshInterval } from '../branding-refresh';

export type CoachBranding = { brandAccent: BrandAccent | null; brandLogoUrl: string | null };
function useBrandingAuth() {
  const token = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.activeRole);
  return { token, role, queryKey: ['coach', 'branding', token, role] as const };
}
export function useBranding() {
  const { token, role, queryKey } = useBrandingAuth();
  return useQuery({
    queryKey,
    enabled: Boolean(token && role === 'coach'),
    queryFn: () => createApiClient({ accessToken: token!, activeRole: 'coach' }).get<CoachBranding>('/coaches/me/branding'),
    staleTime: 60_000,
    refetchInterval: (query) => brandingRefreshInterval(query.state.data?.brandLogoUrl),
  });
}
export function useSaveBranding() {
  const { token, queryKey } = useBrandingAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (brandAccent: BrandAccent | null) =>
      createApiClient({ accessToken: token!, activeRole: 'coach' }).patch<CoachBranding>('/coaches/me/branding', {
        brandAccent,
      }),
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
    },
  });
}
export function useBrandLogo() {
  const { token, queryKey } = useBrandingAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file: File | null): Promise<CoachBranding> => {
      const api = createApiClient({ accessToken: token!, activeRole: 'coach' });
      const form = new FormData();
      if (file) form.append('file', file);
      return file
        ? api.post<CoachBranding>('/coaches/me/branding/logo', form)
        : api.delete<CoachBranding>('/coaches/me/branding/logo');
    },
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
    },
  });
}
