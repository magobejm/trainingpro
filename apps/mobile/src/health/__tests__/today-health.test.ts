import type { HealthSnapshot } from '../provider';
import { todayHealthLines } from '../today-health';

const empty: HealthSnapshot = { heartRate: null, sleepHours: null, steps: null, weightKg: null };

it('lists only the health fields that exist today', () => {
  expect(
    todayHealthLines({
      ...empty,
      heartRate: { average: 120, max: 160 },
      sleepHours: 7.5,
      steps: 8400,
      weightKg: 72.4,
    }).map((line) => line.id),
  ).toEqual(['steps', 'sleep', 'heart', 'weight']);
});

it('is empty when Health Connect has no records today', () => {
  expect(todayHealthLines(null)).toEqual([]);
  expect(todayHealthLines(empty)).toEqual([]);
});
