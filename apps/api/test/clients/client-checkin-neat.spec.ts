import { effectiveNeatStart } from '../../src/modules/clients/application/services/client-neat-log.service';
import { averageCheckinMotivation } from '../../src/modules/clients/application/use-cases/get-client-calendar-summary.usecase';
import { inclusiveDayCount } from '../../src/modules/clients/application/neat-adherence';

describe('calendar summary motivation', () => {
  test('averages check-in motivation on the 1-10 scale', () => {
    expect(averageCheckinMotivation([4])).toBe(8);
    expect(averageCheckinMotivation([4, 5])).toBe(9);
  });

  test('is empty without check-ins', () => {
    expect(averageCheckinMotivation([])).toBeNull();
  });
});

describe('neat window for new clients', () => {
  test('keeps the requested start when the client is older', () => {
    expect(effectiveNeatStart('2026-08-21', new Date('2026-01-01T10:00:00Z'), null)).toBe('2026-08-21');
  });

  test('starts at the sign-up day for a new client', () => {
    expect(effectiveNeatStart('2026-05-24', new Date('2026-11-19T10:00:00Z'), null)).toBe('2026-11-19');
  });

  test('starts at the routine assignment when it is later', () => {
    const created = new Date('2026-11-01T10:00:00Z');
    const applied = new Date('2026-11-10T10:00:00Z');
    expect(effectiveNeatStart('2026-08-21', created, applied)).toBe('2026-11-10');
  });

  test('a client created today has no expected days before today', () => {
    const start = effectiveNeatStart('2026-05-24', new Date('2026-11-19T10:00:00Z'), null);
    expect(inclusiveDayCount(start, '2026-11-18')).toBe(0);
  });
});
