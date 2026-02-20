import { useEffect } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  createApiClient,
  ForbiddenApiError,
  type ActiveRole,
  UnauthorizedApiError,
} from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type MeApiResponse = {
  email: string;
  roles: string[];
};

export type MeQueryData = {
  activeRole: ActiveRole;
  email: string;
  roles: ActiveRole[];
};

const ALL_ROLES: ActiveRole[] = ['admin', 'coach', 'client'];

export function useMeQuery(): UseQueryResult<MeQueryData, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const setAvailableRoles = useAuthStore((state) => state.setAvailableRoles);
  const query = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => fetchMeWithFallback(accessToken ?? '', activeRole),
    queryKey: ['users', 'me', activeRole, accessToken],
  });
  useSyncAuthState(query.data, setActiveRole, setAvailableRoles);
  return query;
}

function useSyncAuthState(
  data: MeQueryData | undefined,
  setActiveRole: (role: ActiveRole) => void,
  setAvailableRoles: (roles: ActiveRole[]) => void,
): void {
  useEffect(() => {
    if (!data) {
      return;
    }
    setActiveRole(data.activeRole);
    setAvailableRoles(data.roles);
  }, [data, setActiveRole, setAvailableRoles]);
}

async function fetchMeWithFallback(
  accessToken: string,
  preferredRole: ActiveRole | null,
): Promise<MeQueryData> {
  let lastError: Error | null = null;
  for (const role of buildRoleCandidates(preferredRole)) {
    try {
      const profile = await fetchMe(accessToken, role);
      return {
        activeRole: role,
        email: profile.email,
        roles: normalizeRoles(profile.roles, role),
      };
    } catch (caught) {
      if (!isRoleError(caught)) {
        throw asError(caught);
      }
      lastError = asError(caught);
    }
  }
  throw lastError ?? new Error('Unable to load authenticated profile');
}

function buildRoleCandidates(preferredRole: ActiveRole | null): ActiveRole[] {
  if (!preferredRole) {
    return ALL_ROLES;
  }
  return [preferredRole, ...ALL_ROLES.filter((role) => role !== preferredRole)];
}

function normalizeRoles(input: string[], activeRole: ActiveRole): ActiveRole[] {
  const detected = input.filter(isActiveRole);
  if (detected.includes(activeRole)) {
    return detected;
  }
  return [activeRole, ...detected];
}

function fetchMe(accessToken: string, activeRole: ActiveRole): Promise<MeApiResponse> {
  return createApiClient({ accessToken, activeRole }).get<MeApiResponse>('/users/me');
}

function isRoleError(error: unknown): boolean {
  return error instanceof UnauthorizedApiError || error instanceof ForbiddenApiError;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unexpected profile error');
}

function isActiveRole(role: string): role is ActiveRole {
  return ALL_ROLES.includes(role as ActiveRole);
}
