import type { HealthSnapshot } from './provider';

const FAKE_KEY = 'trainerpro.mobile.health.fake';

export function healthStatus(): Promise<'ready' | 'unavailable'> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return Promise.resolve('unavailable');
  return Promise.resolve(globalThis.localStorage?.getItem(FAKE_KEY) ? 'ready' : 'unavailable');
}

export function requestHealthAccess(): Promise<boolean> {
  return healthStatus().then((status) => status === 'ready');
}

export function readHealthSnapshot(): Promise<HealthSnapshot | null> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return Promise.resolve(null);
  const raw = globalThis.localStorage?.getItem(FAKE_KEY);
  if (!raw) return Promise.resolve(null);
  return Promise.resolve(JSON.parse(raw) as HealthSnapshot);
}
