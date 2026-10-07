import { UNAUTHORIZED_EVENT } from './api-client';

let sessionExpired = false;

export function markSessionExpired(): void {
  sessionExpired = true;
}

export function readSessionExpired(): boolean {
  return sessionExpired;
}

export function clearSessionExpired(): void {
  sessionExpired = false;
}

export function requestSignIn(): void {
  const scope = globalThis as { dispatchEvent?: (event: Event) => void };
  if (!scope.dispatchEvent || typeof Event === 'undefined') {
    return;
  }
  scope.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}
