export { aggregateHeartRate, sleepScore, stepsTarget } from './health-metrics';
export { healthStatus, readHealthSnapshot, requestHealthAccess, type HealthSnapshot } from './provider';

import { readHealthSnapshot } from './provider';

export async function readTodaySteps(): Promise<number | null> {
  return (await readHealthSnapshot())?.steps ?? null;
}

export async function readSleepHours(): Promise<number | null> {
  return (await readHealthSnapshot())?.sleepHours ?? null;
}

export async function readLatestWeightKg(): Promise<number | null> {
  return (await readHealthSnapshot())?.weightKg ?? null;
}

export async function readHeartRateSample(): Promise<{ average: number; max: number } | null> {
  return (await readHealthSnapshot())?.heartRate ?? null;
}
