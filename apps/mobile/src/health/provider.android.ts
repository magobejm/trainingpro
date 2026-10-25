import { aggregateHeartRate } from './health-metrics';
import type { HealthSnapshot } from './provider';

const PERMISSIONS = [
  'Steps',
  'SleepSession',
  'Weight',
  'HeartRate',
  'RestingHeartRate',
  'HeartRateVariabilityRmssd',
  'ExerciseSession',
  'ActiveCaloriesBurned',
] as const;

type HealthConnectModule = {
  initialize: () => Promise<boolean>;
  readRecords: (
    recordType: string,
    options: { timeRangeFilter: { operator: 'between'; startTime: string; endTime: string } },
  ) => Promise<{ records: Array<Record<string, unknown>> }>;
  requestPermission: (permissions: Array<{ accessType: 'read'; recordType: string }>) => Promise<unknown>;
};

export function healthStatus(): Promise<'ready' | 'unavailable'> {
  return load().then((module) => (module ? 'ready' : 'unavailable'));
}

export async function requestHealthAccess(): Promise<boolean> {
  const module = await load();
  if (!module) return false;
  const ready = await module.initialize();
  if (!ready) return false;
  await module.requestPermission(PERMISSIONS.map((recordType) => ({ accessType: 'read' as const, recordType })));
  return true;
}

export async function readHealthSnapshot(): Promise<HealthSnapshot | null> {
  const module = await load();
  if (!module) return null;
  const ready = await module.initialize();
  if (!ready) return null;
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  const range = {
    timeRangeFilter: { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() },
  };
  const [steps, sleep, weight, heart] = await Promise.all([
    module.readRecords('Steps', range),
    module.readRecords('SleepSession', range),
    module.readRecords('Weight', range),
    module.readRecords('HeartRate', range),
  ]);
  return {
    heartRate: aggregateHeartRate(beats(heart.records)),
    sleepHours: sleepHours(sleep.records),
    steps: sumSteps(steps.records),
    weightKg: latestWeight(weight.records),
  };
}

async function load(): Promise<HealthConnectModule | null> {
  try {
    return (await import('react-native-health-connect')) as unknown as HealthConnectModule;
  } catch {
    return null;
  }
}

function sumSteps(records: Array<Record<string, unknown>>): number | null {
  const total = records.reduce((sum, record) => sum + numberValue(record['count']), 0);
  return records.length > 0 ? total : null;
}

function latestWeight(records: Array<Record<string, unknown>>): number | null {
  const last = records.at(-1);
  const weight = last ? numberValue(last['weight']) : 0;
  return weight > 0 ? weight : null;
}

function sleepHours(records: Array<Record<string, unknown>>): number | null {
  const minutes = records.reduce((sum, record) => {
    const start = Date.parse(String(record['startTime'] ?? ''));
    const end = Date.parse(String(record['endTime'] ?? ''));
    return Number.isFinite(start) && Number.isFinite(end) ? sum + (end - start) / 60_000 : sum;
  }, 0);
  return minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : null;
}

function beats(records: Array<Record<string, unknown>>): number[] {
  return records.flatMap((record) => {
    const samples = record['samples'];
    if (!Array.isArray(samples)) return [];
    return samples.map((sample) => numberValue((sample as { beatsPerMinute?: unknown }).beatsPerMinute));
  });
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'inKilograms' in value) return Number(value.inKilograms);
  return 0;
}
