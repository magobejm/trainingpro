import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ClientManagementSectionCode =
  | 'training'
  | 'nutrition'
  | 'mood'
  | 'volume'
  | 'progress'
  | 'anthropometrics'
  | 'planning'
  | 'external'
  | 'incidents'
  | 'chat';

export type ClientManagementSectionView = {
  archived: boolean;
  code: ClientManagementSectionCode;
  sortOrder: number;
};

type SectionsResponse = {
  items: ClientManagementSectionView[];
};

export function useClientManagementSectionsQuery(
  clientId: string,
): UseQueryResult<ClientManagementSectionView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => fetchSections(auth, clientId),
    queryKey: ['clients', 'management-sections', clientId, auth?.activeRole, auth?.accessToken],
  });
}

export function useUpdateClientManagementSectionsMutation(clientId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ClientManagementSectionView[]) => updateSections(auth, clientId, items),
    onSuccess: (items) => {
      queryClient.setQueryData(['clients', 'management-sections', clientId], items);
      void queryClient.invalidateQueries({
        queryKey: ['clients', 'management-sections', clientId],
      });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchSections(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
): Promise<ClientManagementSectionView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  const response = await createApiClient(auth).get<SectionsResponse>(
    `/clients/${clientId}/management-sections`,
  );
  return response.items;
}

async function updateSections(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  items: ClientManagementSectionView[],
): Promise<ClientManagementSectionView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  const response = await createApiClient(auth).patch<SectionsResponse>(
    `/clients/${clientId}/management-sections`,
    { items },
  );
  return response.items;
}
