import { shouldPersistQuery } from '../query-persistence';

it('keeps the offline whitelist and drops the access token', () => {
  expect(shouldPersistQuery(['clients', 'me', 'routine'])).toBe(true);
  expect(shouldPersistQuery(['clients', 'me', 'plan-days', 'day-1'])).toBe(true);
  expect(shouldPersistQuery(['clients', 'me', 'calendar', '2026-10-19', '2026-10-25'])).toBe(true);
  expect(shouldPersistQuery(['clients', 'me', 'sessions', '2026-10-19', '2026-10-25'])).toBe(true);
  expect(shouldPersistQuery(['clients', 'me', 'nutrition'])).toBe(true);
  expect(shouldPersistQuery(['clients', 'me', 'neat-logs', '2026-10-24'])).toBe(true);
  expect(shouldPersistQuery(['session', 'session-1', 'client'])).toBe(true);
  expect(shouldPersistQuery(['clients', 'me', 'nutrition', 'foods', 'avena'])).toBe(false);
  expect(shouldPersistQuery(['clients', 'me', 'routine', 'token'])).toBe(false);
});
