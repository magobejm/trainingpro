import { parseRecoveryUrl, type RecoveryHash } from '@trainerpro/shared';
import { create } from 'zustand';

export type RecoveryPhase = RecoveryHash['status'];

export type RecoveryState = {
  accessToken: null | string;
  dismiss: () => void;
  finish: () => void;
  passwordUpdated: boolean;
  phase: RecoveryPhase;
  refreshToken: null | string;
};

type RecoveryFields = Pick<RecoveryState, 'accessToken' | 'passwordUpdated' | 'phase' | 'refreshToken'>;

const IDLE: RecoveryFields = {
  accessToken: null,
  passwordUpdated: false,
  phase: 'none',
  refreshToken: null,
};

export function stateFromRecovery(parsed: RecoveryHash): RecoveryFields {
  return {
    accessToken: parsed.status === 'ready' ? parsed.accessToken : null,
    passwordUpdated: false,
    phase: parsed.status,
    refreshToken: parsed.status === 'ready' ? parsed.refreshToken : null,
  };
}

/** Guarda los tokens del enlace. No abre sesión en Supabase. */
export function applyRecoveryUrl(url: string | null): void {
  const parsed = parseRecoveryUrl(url ?? '');
  if (parsed.status === 'none') {
    return;
  }
  usePasswordRecoveryStore.setState(stateFromRecovery(parsed));
}

export const usePasswordRecoveryStore = create<RecoveryState>()((set) => ({
  ...readWebRecovery(),
  dismiss: () => set({ accessToken: null, phase: 'none', refreshToken: null }),
  finish: () => set({ accessToken: null, passwordUpdated: true, phase: 'none', refreshToken: null }),
}));

function readWebRecovery(): RecoveryFields {
  const location = (globalThis as { location?: { href?: string } }).location;
  if (!location?.href) {
    return IDLE;
  }
  const parsed = parseRecoveryUrl(location.href);
  return parsed.status === 'none' ? IDLE : stateFromRecovery(parsed);
}
