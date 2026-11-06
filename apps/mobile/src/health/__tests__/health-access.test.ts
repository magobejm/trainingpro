import { healthAccessFromGrants } from '../health-access';

it('stays unavailable when Health Connect itself is missing', () => {
  expect(healthAccessFromGrants(false, 0)).toBe('unavailable');
  expect(healthAccessFromGrants(false, 3)).toBe('unavailable');
});

it('is denied when the SDK is ready but no read permission was granted', () => {
  expect(healthAccessFromGrants(true, 0)).toBe('denied');
});

it('is connected when at least one read permission was granted', () => {
  expect(healthAccessFromGrants(true, 1)).toBe('connected');
});
