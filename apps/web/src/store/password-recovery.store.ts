import { create } from 'zustand';
import { parseRecoveryHash, type RecoveryHash } from '../data/password-recovery';

export type RecoveryPhase = RecoveryHash['status'];

export type RecoveryState = {
  accessToken: null | string;
  dismiss: () => void;
  finish: () => void;
  passwordUpdated: boolean;
  phase: RecoveryPhase;
  refreshToken: null | string;
};

type LocationScope = {
  history?: { replaceState: (data: unknown, unused: string, url?: string) => void };
  location?: { hash: string; pathname: string; search: string };
};

/**
 * Lee el enlace de recuperación al arrancar y borra los tokens de la URL
 * para que no queden en el historial ni en el portapapeles.
 */
export function readRecoveryFromLocation(scope: LocationScope): RecoveryHash {
  const location = scope.location;
  if (!location?.hash) return { status: 'none' };
  const parsed = parseRecoveryHash(location.hash);
  if (parsed.status !== 'none') {
    scope.history?.replaceState(null, '', `${location.pathname}${location.search}`);
  }
  return parsed;
}

function initialState(): Pick<RecoveryState, 'accessToken' | 'passwordUpdated' | 'phase' | 'refreshToken'> {
  const parsed = readRecoveryFromLocation(globalThis as LocationScope);
  return {
    accessToken: parsed.status === 'ready' ? parsed.accessToken : null,
    passwordUpdated: false,
    phase: parsed.status,
    refreshToken: parsed.status === 'ready' ? parsed.refreshToken : null,
  };
}

export const usePasswordRecoveryStore = create<RecoveryState>()((set) => ({
  ...initialState(),
  dismiss: () => set({ accessToken: null, phase: 'none', refreshToken: null }),
  finish: () => set({ accessToken: null, passwordUpdated: true, phase: 'none', refreshToken: null }),
}));
