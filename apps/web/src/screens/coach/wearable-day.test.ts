import { expect, it } from 'vitest';
import { describeWearableDay, type WearableMetric } from './wearable-day';

const day: WearableMetric = {
  date: '2026-11-06',
  hrvMs: 42,
  restingHr: 58,
  sleepMinutes: 450,
  source: 'HEALTH_CONNECT',
  steps: 8400,
};

it('turns sleep minutes into hours and keeps the other fields', () => {
  expect(describeWearableDay(day)).toEqual({
    date: '2026-11-06',
    hrvMs: 42,
    restingHr: 58,
    sleepHours: 7.5,
    source: 'HEALTH_CONNECT',
    steps: 8400,
  });
});

it('leaves a missing field out of the day', () => {
  expect(describeWearableDay({ ...day, hrvMs: null, restingHr: null, sleepMinutes: null, steps: null })).toMatchObject({
    hrvMs: null,
    restingHr: null,
    sleepHours: null,
    steps: null,
  });
});
