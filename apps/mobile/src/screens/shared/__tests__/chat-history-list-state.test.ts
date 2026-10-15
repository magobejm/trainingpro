import {
  appendedMessageCount,
  shouldLoadHistory,
  messageDateLabel,
  restoredAnchorOffset,
  anchorHasSettled,
} from '../chat-history-list-state';
const messages = (ids: string[]) => ids.map((id) => ({ id, createdAt: '2026-10-15T12:00:00Z' }));
describe('mobile chat reading state', () => {
  it('counts arrivals at the end without treating older pages as new', () => {
    expect(appendedMessageCount(messages(['b', 'c']), messages(['a', 'b', 'c', 'd', 'e']))).toBe(2);
    expect(appendedMessageCount(messages(['b', 'c']), messages(['a', 'b', 'c']))).toBe(0);
    expect(appendedMessageCount([], messages(['a']))).toBe(0);
  });
  it('does not load automatically after a history error or while already loading', () => {
    expect(shouldLoadHistory(120, true, false, null)).toBe(true);
    expect(shouldLoadHistory(121, true, false, null)).toBe(false);
    expect(shouldLoadHistory(0, true, true, null)).toBe(false);
    expect(shouldLoadHistory(0, true, false, new Error('offline'))).toBe(false);
    expect(shouldLoadHistory(0, false, false, null)).toBe(false);
  });
  it('adjusts by the visible anchor movement, excluding concurrent appended content', () => {
    expect(restoredAnchorOffset(80, 120, 820)).toBe(780);
    expect(restoredAnchorOffset(780, 120, 120)).toBe(780);
  });
  it('keeps compensating while virtualizer batches are still settling', () => {
    expect(anchorHasSettled(8, 100)).toBe(false);
    expect(anchorHasSettled(2, 300)).toBe(false);
    expect(anchorHasSettled(8, 300)).toBe(true);
    expect(anchorHasSettled(0, 1500)).toBe(true);
  });
  it('uses the actual message day and translates today', () => {
    expect(messageDateLabel('2026-10-15T12:00:00Z', 'en', 'Today', new Date('2026-10-15T15:00:00Z'))).toBe('Today');
    expect(messageDateLabel('2026-09-10T12:00:00Z', 'en', 'Today', new Date('2026-10-15T15:00:00Z'))).toContain('September');
  });
});
