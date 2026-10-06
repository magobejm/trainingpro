import {
  canSubmitMorningCheckin,
  formatMorningCheckinChatNotice,
  localDateKey,
  migrateDailyCheckin,
  readTodayCheckin,
  scaleFiveToTen,
  shouldPromptMorningCheckin,
  writeTodayCheckin,
  SLEEP_OPTIONS,
  MOTIVATION_OPTIONS,
  RECOVERY_OPTIONS,
  type DailyCheckinEntries,
} from '../daily-checkin.utils';

describe('morning check-in', () => {
  it('prompts once per local day, whether the athlete answered or skipped', () => {
    expect(shouldPromptMorningCheckin(null, '2026-10-02')).toBe(true);
    expect(shouldPromptMorningCheckin('2026-10-01', '2026-10-02')).toBe(true);
    expect(shouldPromptMorningCheckin('2026-10-02', '2026-10-02')).toBe(false);
  });

  it('opens a new daily record at local midnight', () => {
    expect(localDateKey(new Date(Date.UTC(2026, 9, 2, 23, 59, 59)), 0)).toBe('2026-10-02');
    expect(localDateKey(new Date(Date.UTC(2026, 9, 3, 0, 0, 0)), 0)).toBe('2026-10-03');
    expect(shouldPromptMorningCheckin('2026-10-02', localDateKey(new Date(Date.UTC(2026, 9, 3, 0, 0, 0)), 0))).toBe(true);
  });

  it('builds a stable local date key from an explicit offset', () => {
    const at2330Utc = new Date(Date.UTC(2026, 9, 2, 23, 30));
    expect(localDateKey(at2330Utc, 120)).toBe('2026-10-03');
    expect(localDateKey(at2330Utc, -300)).toBe('2026-10-02');
    expect(localDateKey(at2330Utc, 0)).toBe('2026-10-02');
  });

  it('reads only the signed-in user entry for today', () => {
    const scores = { sleep: 4, motivation: 5, recovery: 3 };
    const entries: DailyCheckinEntries = {
      'user-a': { date: '2026-10-02', scores },
      'user-b': { date: '2026-10-01', scores },
    };
    expect(readTodayCheckin(entries, 'user-a', '2026-10-02')).toEqual({ date: '2026-10-02', scores });
    expect(readTodayCheckin(entries, 'user-c', '2026-10-02')).toBeNull();
    expect(readTodayCheckin(entries, 'user-b', '2026-10-02')).toBeNull();
    expect(readTodayCheckin({ 'user-a': { date: '2026-10-02', scores: null } }, 'user-a', '2026-10-02')).toEqual({
      date: '2026-10-02',
      scores: null,
    });
  });

  it('keeps other users from today and drops older days', () => {
    const scores = { sleep: 2, motivation: 2, recovery: 2 };
    const next = writeTodayCheckin(
      {
        'user-a': { date: '2026-10-01', scores },
        'user-b': { date: '2026-10-02', scores },
      },
      'user-c',
      '2026-10-02',
      null,
    );
    expect(next).toEqual({
      'user-b': { date: '2026-10-02', scores },
      'user-c': { date: '2026-10-02', scores: null },
    });
  });

  it('discards the previous global check-in because its user is unknown', () => {
    expect(migrateDailyCheckin({ lastPromptDate: '2026-10-02', scores: { sleep: 4, motivation: 5, recovery: 3 } })).toEqual({
      entries: {},
    });
  });

  it('requires sleep, motivation and recovery from 1 to 5', () => {
    expect(canSubmitMorningCheckin({ sleep: 3, motivation: 4, recovery: 5 })).toBe(true);
    expect(canSubmitMorningCheckin({ sleep: null, motivation: 4, recovery: 5 })).toBe(false);
    expect(canSubmitMorningCheckin({ sleep: 3, motivation: 0, recovery: 5 })).toBe(false);
  });

  it('maps 1-5 scores onto the existing 1-10 session fields', () => {
    expect(scaleFiveToTen(1)).toBe(2);
    expect(scaleFiveToTen(5)).toBe(10);
  });

  it('formats a chat notice for the coach', () => {
    expect(formatMorningCheckinChatNotice({ sleep: 4, motivation: 5, recovery: 3 })).toBe(
      'Check-in diario: Sueño 4/5, Motivación 5/5, Recuperación 3/5.',
    );
  });

  it('uses the prototype emoji scales', () => {
    expect(SLEEP_OPTIONS.map((option) => option.emoji)).toEqual(['😫', '🥱', '😐', '🙂', '😴']);
    expect(MOTIVATION_OPTIONS.map((option) => option.emoji)).toEqual(['😞', '😕', '😐', '😊', '🔥']);
    expect(RECOVERY_OPTIONS.map((option) => option.emoji)).toEqual(['🪫', '🤕', '😐', '🔋', '⚡']);
  });
});
