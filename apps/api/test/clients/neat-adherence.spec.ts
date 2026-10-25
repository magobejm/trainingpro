import { inclusiveDayCount, neatAdherence } from '../../src/modules/clients/application/neat-adherence';

it('counts checked goals against goals times days', () => {
  expect(neatAdherence(3, 8)).toEqual({ done: 3, expected: 8, percent: 37.5 });
});

it('returns no percent when the client has no NEAT goals', () => {
  expect(neatAdherence(0, 0).percent).toBeNull();
});

it('counts both ends of the range', () => {
  expect(inclusiveDayCount('2026-10-24', '2026-10-24')).toBe(1);
  expect(inclusiveDayCount('2026-10-22', '2026-10-24')).toBe(3);
});
