import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { routineAssignmentDetailSchema, routineAssignmentListSchema } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { RoutineTemplateView } from './useRoutineTemplates';
import { decodeUserKey } from '../../theme/appearance.logic';

function useAssignmentAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const userId = decodeUserKey(accessToken);
  return { accessToken, activeRole, userId };
}
export function useAppliedRoutineQuery(clientId: string | null | undefined) {
  const auth = useAssignmentAuth();
  return useQuery({
    queryKey: ['routine-assignments', auth.userId, auth.activeRole, clientId, 'current'],
    enabled: Boolean(clientId && auth.accessToken && auth.activeRole),
    queryFn: () =>
      createApiClient(auth as Parameters<typeof createApiClient>[0]).get<RoutineTemplateView | null>(
        `/clients/${clientId}/routine-assignments/current`,
      ),
  });
}
export function useRoutineAssignmentsQuery(clientId: string, enabled: boolean) {
  const auth = useAssignmentAuth();
  return useInfiniteQuery({
    queryKey: ['routine-assignments', auth.userId, auth.activeRole, clientId, 'history'],
    enabled: Boolean(enabled && clientId && auth.accessToken && auth.activeRole),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      routineAssignmentListSchema.parse(
        await createApiClient(auth as Parameters<typeof createApiClient>[0]).get(
          `/clients/${clientId}/routine-assignments${pageParam ? `?before=${pageParam}` : ''}`,
        ),
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
export function useRoutineAssignmentDetailQuery(clientId: string, assignmentId: string | null) {
  const auth = useAssignmentAuth();
  return useQuery({
    queryKey: ['routine-assignments', auth.userId, auth.activeRole, clientId, assignmentId],
    enabled: Boolean(assignmentId && auth.accessToken && auth.activeRole),
    queryFn: async () =>
      routineAssignmentDetailSchema.parse(
        await createApiClient(auth as Parameters<typeof createApiClient>[0]).get(
          `/clients/${clientId}/routine-assignments/${assignmentId}`,
        ),
      ),
  });
}
