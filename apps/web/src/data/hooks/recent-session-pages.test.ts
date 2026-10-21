import { it, expect } from 'vitest';
import { allSessionPages } from './recent-session-pages';
it('follows date/id cursors until empty without dropping an exact page', async () => {
  const calls: Array<{ beforeDate?: string; beforeId?: string }> = [];
  const rows = await allSessionPages(async (cursor) => {
    calls.push(cursor);
    return calls.length === 1
      ? [
          { sessionDate: '2026-10-20', sessionId: 'b' },
          { sessionDate: '2026-10-20', sessionId: 'a' },
        ]
      : calls.length === 2
        ? [
            { sessionDate: '2026-10-19', sessionId: 'd' },
            { sessionDate: '2026-10-19', sessionId: 'c' },
          ]
        : [];
  }, 2);
  expect(rows.map((r) => r.sessionId)).toEqual(['b', 'a', 'd', 'c']);
  expect(calls).toEqual([{}, { beforeDate: '2026-10-20', beforeId: 'a' }, { beforeDate: '2026-10-19', beforeId: 'c' }]);
});
