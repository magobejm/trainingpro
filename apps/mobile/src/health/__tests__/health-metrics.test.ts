import { aggregateHeartRate, sleepScore, stepsTarget } from '../health-metrics';

it('maps sleep hours onto the morning scale', () => {
  expect(sleepScore(4.5)).toBe(1);
  expect(sleepScore(5)).toBe(2);
  expect(sleepScore(6.5)).toBe(3);
  expect(sleepScore(7.5)).toBe(4);
  expect(sleepScore(8)).toBe(5);
  expect(sleepScore(null)).toBeNull();
});

it('reads a step target from a NEAT title', () => {
  expect(stepsTarget('Andar 10.000 pasos diarios')).toBe(10000);
  expect(stepsTarget('Caminar 8000 steps')).toBe(8000);
  expect(stepsTarget('Beber agua')).toBeNull();
});

it('aggregates heart-rate samples', () => {
  expect(aggregateHeartRate([120, 150, 140])).toEqual({ average: 137, max: 150 });
  expect(aggregateHeartRate([])).toBeNull();
});
