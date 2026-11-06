import type { HealthAccess, HealthRevoke, HealthSnapshot } from './provider';

export function healthStatus(): Promise<'unavailable'> {
  return Promise.resolve('unavailable');
}

export function readHealthAccess(): Promise<HealthAccess> {
  return Promise.resolve('unavailable');
}

export function readHealthSnapshot(): Promise<HealthSnapshot | null> {
  return Promise.resolve(null);
}

export function requestHealthAccess(): Promise<boolean> {
  return Promise.resolve(false);
}

export function revokeHealthAccess(): Promise<HealthRevoke> {
  return Promise.resolve('unavailable');
}
