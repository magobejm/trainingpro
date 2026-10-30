import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CoachPresetItem, CommandApplyRequest, CommandApplyResponse, CommandRule } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import { decodeUserKey } from '../../theme/appearance.logic';

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return { accessToken, activeRole, userId: decodeUserKey(accessToken) };
}

type Auth = ReturnType<typeof useAuth>;
const api = (auth: Auth) => createApiClient(auth as Parameters<typeof createApiClient>[0]);
const PRESETS_PATH = '/coach/progression-presets';

/** Custom values the coach saved with "+ Añadir". They follow the coach to every client. */
export function useProgressionPresets() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['progression-presets', auth.userId, auth.activeRole];
  const query = useQuery({
    enabled: Boolean(auth.accessToken && auth.activeRole),
    queryFn: () => api(auth).get<CoachPresetItem[]>(PRESETS_PATH),
    queryKey,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const add = useMutation({
    mutationFn: (rule: CommandRule) => api(auth).post<CoachPresetItem>(PRESETS_PATH, rule),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(auth).delete<{ ok: boolean }>(`${PRESETS_PATH}/${id}`),
    onSuccess: refresh,
  });
  return { add, presets: query.data ?? [], remove };
}

/** One call, one transaction on the server. Every week view is refreshed afterwards. */
export function useApplyProgression(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandApplyRequest) =>
      api(auth).post<CommandApplyResponse>(`/clients/${clientId}/routine/progression`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-routine'] }),
  });
}
