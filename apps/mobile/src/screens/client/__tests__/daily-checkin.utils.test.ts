import {
  canSubmitMorningCheckin,
  formatMorningCheckinChatNotice,
  localDateKey,
  scaleFiveToTen,
  shouldPromptMorningCheckin,
  SLEEP_OPTIONS,
  MOTIVATION_OPTIONS,
  RECOVERY_OPTIONS,
} from '../daily-checkin.utils';

describe('morning check-in', () => {
  it('prompts once per local day, whether the athlete answered or skipped', () => {
    expect(shouldPromptMorningCheckin(null, '2026-10-02')).toBe(true);
    expect(shouldPromptMorningCheckin('2026-10-01', '2026-10-02')).toBe(true);
    expect(shouldPromptMorningCheckin('2026-10-02', '2026-10-02')).toBe(false);
  });

  it('opens a new daily record at local midnight', () => {
    expect(localDateKey(new Date(2026, 9, 2, 23, 59, 59))).toBe('2026-10-02');
    expect(localDateKey(new Date(2026, 9, 3, 0, 0, 0))).toBe('2026-10-03');
    expect(shouldPromptMorningCheckin('2026-10-02', localDateKey(new Date(2026, 9, 3, 0, 0, 0)))).toBe(true);
  });

  it('builds a stable local date key', () => {
    expect(localDateKey(new Date(2026, 9, 2, 8, 15))).toBe('2026-10-02');
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
