import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type OrgOccupancy = {
  activeClientCount: number;
  clientLimit: number;
  organizationId: string;
};

export type CoachMetric = {
  activeClients: number | null;
  adherencePercent: number | null;
  archivedClients: number | null;
  coachEmail: string;
  incidentResponseHours: number | null;
};

export type BillingEstimate = {
  activeClients: number;
  clientsToNext: number | null;
  estimatedMonthly: number | null;
};

export type PricingTier = { fromClients: number; monthlyPrice: number; toClients: number | null };

function useAdminAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return accessToken && activeRole ? { accessToken, activeRole } : null;
}

function requireAuth(auth: ReturnType<typeof useAdminAuth>) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth);
}

export function useOrgOccupancyQuery() {
  const auth = useAdminAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => requireAuth(auth).get<OrgOccupancy>('/org/subscription/occupancy'),
    queryKey: ['org', 'subscription', 'occupancy', auth?.activeRole, auth?.accessToken],
  });
}

export function useCoachMetricsQuery() {
  const auth = useAdminAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => requireAuth(auth).get<{ coaches: CoachMetric[] }>('/org/coaches/metrics'),
    queryKey: ['org', 'coach-metrics', auth?.activeRole, auth?.accessToken],
  });
}

export function useBillingEstimateQuery() {
  const auth = useAdminAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => requireAuth(auth).get<BillingEstimate>('/org/subscription/billing-estimate'),
    queryKey: ['org', 'billing-estimate', auth?.activeRole, auth?.accessToken],
  });
}

export function useUpdateClientLimitMutation() {
  const auth = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientLimit: number) => requireAuth(auth).patch<OrgOccupancy>('/org/subscription/limit', { clientLimit }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['org'] });
    },
  });
}

export function usePricingTiersMutation() {
  const auth = useAdminAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tiers: PricingTier[]) => requireAuth(auth).put('/org/subscription/pricing-tiers', { tiers }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['org'] });
    },
  });
}
