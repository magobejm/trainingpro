import type { HealthAccess } from './health-access';

export type { HealthAccess } from './health-access';

export type HealthRevoke = 'disconnected' | 'pending' | 'unavailable';

export type HealthSnapshot = {
  activeKcal?: number | null;
  heartRate: { average: number; max: number } | null;
  hrvMs?: number | null;
  restingHr?: number | null;
  sleepHours: number | null;
  steps: number | null;
  weightKg: number | null;
};

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
