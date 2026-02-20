import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { ActiveRole } from '../data/api-client';

type AuthState = {
  accessToken: null | string;
  activeRole: ActiveRole | null;
  availableRoles: ActiveRole[];
  clearSession: () => void;
  setActiveRole: (role: ActiveRole) => void;
  setAvailableRoles: (roles: ActiveRole[]) => void;
  setSession: (accessToken: string) => void;
};

const STORAGE_KEY = 'trainerpro.mobile.auth';
const DEFAULT_ROLE: ActiveRole = 'coach';
const memoryStorage = new Map<string, string>();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      activeRole: DEFAULT_ROLE,
      availableRoles: [],
      clearSession: () => set(resetAuthState),
      setActiveRole: (role) => set({ activeRole: role }),
      setAvailableRoles: (roles) =>
        set((state) => ({
          activeRole: selectActiveRole(state.activeRole, roles),
          availableRoles: roles,
        })),
      setSession: (accessToken) =>
        set((state) => ({
          accessToken,
          activeRole: state.activeRole ?? DEFAULT_ROLE,
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: selectPersistedState,
      storage: createJSONStorage(createStateStorage),
    },
  ),
);

function resetAuthState(): Pick<AuthState, 'accessToken' | 'activeRole' | 'availableRoles'> {
  return {
    accessToken: null,
    activeRole: DEFAULT_ROLE,
    availableRoles: [],
  };
}

function selectPersistedState(state: AuthState) {
  return {
    accessToken: state.accessToken,
    activeRole: state.activeRole,
    availableRoles: state.availableRoles,
  };
}

function selectActiveRole(
  currentRole: ActiveRole | null,
  roles: ActiveRole[],
): ActiveRole | null {
  if (currentRole && roles.includes(currentRole)) {
    return currentRole;
  }
  return roles[0] ?? null;
}

function createStateStorage(): StateStorage {
  const browserStorage = readBrowserStorage();
  if (browserStorage) {
    return browserStorage;
  }
  return createMemoryStorage();
}

function readBrowserStorage(): StateStorage | null {
  const scope = globalThis as { localStorage?: StateStorage };
  return scope.localStorage ?? null;
}

function createMemoryStorage(): StateStorage {
  return {
    getItem: (name) => memoryStorage.get(name) ?? null,
    removeItem: (name) => {
      memoryStorage.delete(name);
    },
    setItem: (name, value) => {
      memoryStorage.set(name, value);
    },
  };
}
