import { create } from 'zustand';
import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import { createAuthStateStorage } from '../data/auth-storage';
import type { ActiveRole } from '../data/api-client';

export type AuthStatus = 'restoring' | 'signedIn' | 'signedOut';

type ApplySessionOptions = {
  resetRoles?: boolean;
};

type AuthState = {
  accessToken: null | string;
  activeRole: ActiveRole | null;
  applySession: (accessToken: string, userId: string, options?: ApplySessionOptions) => void;
  availableRoles: ActiveRole[];
  resetSession: () => void;
  setActiveRole: (role: ActiveRole) => void;
  setAvailableRoles: (roles: ActiveRole[]) => void;
  status: AuthStatus;
  userId: null | string;
};

type PersistedAuth = {
  activeRole: ActiveRole | null;
  availableRoles: ActiveRole[];
  userId: null | string;
};

const STORAGE_KEY = 'trainerpro.mobile.auth';
const DEFAULT_ROLE: ActiveRole = 'coach';
const KNOWN_ROLES: ActiveRole[] = ['admin', 'coach', 'client'];

const authPersistOptions: PersistOptions<AuthState, PersistedAuth> = {
  migrate: (persisted) => readPersistedAuth(persisted),
  name: STORAGE_KEY,
  partialize: selectPersistedState,
  storage: createJSONStorage(createAuthStateStorage),
  version: 1,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      activeRole: DEFAULT_ROLE,
      availableRoles: [],
      status: 'restoring',
      userId: null,
      applySession: (accessToken, userId, options) =>
        set((state) => ({
          accessToken,
          activeRole: options?.resetRoles ? DEFAULT_ROLE : state.activeRole,
          availableRoles: options?.resetRoles ? [] : state.availableRoles,
          status: 'signedIn',
          userId,
        })),
      resetSession: () => set(signedOutState()),
      setActiveRole: (role) => set({ activeRole: role }),
      setAvailableRoles: (roles) =>
        set((state) => ({
          activeRole: selectActiveRole(state.activeRole, roles),
          availableRoles: roles,
        })),
    }),
    authPersistOptions,
  ),
);

function signedOutState(): Pick<AuthState, 'accessToken' | 'activeRole' | 'availableRoles' | 'status' | 'userId'> {
  return {
    accessToken: null,
    activeRole: DEFAULT_ROLE,
    availableRoles: [],
    status: 'signedOut',
    userId: null,
  };
}

function selectPersistedState(state: AuthState): PersistedAuth {
  return {
    activeRole: state.activeRole,
    availableRoles: state.availableRoles,
    userId: state.userId,
  };
}

function readPersistedAuth(persisted: unknown): PersistedAuth {
  if (!persisted || typeof persisted !== 'object') {
    return { activeRole: DEFAULT_ROLE, availableRoles: [], userId: null };
  }
  const record = persisted as { activeRole?: unknown; availableRoles?: unknown; userId?: unknown };
  return {
    activeRole: isActiveRole(record.activeRole) ? record.activeRole : DEFAULT_ROLE,
    availableRoles: readRoles(record.availableRoles),
    userId: typeof record.userId === 'string' ? record.userId : null,
  };
}

function readRoles(value: unknown): ActiveRole[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isActiveRole);
}

function selectActiveRole(currentRole: ActiveRole | null, roles: ActiveRole[]): ActiveRole | null {
  if (currentRole && roles.includes(currentRole)) {
    return currentRole;
  }
  return roles[0] ?? null;
}

function isActiveRole(role: unknown): role is ActiveRole {
  return KNOWN_ROLES.includes(role as ActiveRole);
}
