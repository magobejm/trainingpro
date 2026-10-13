import { pageTimeline, type TimelineDraft, type TimelinePage } from '../../src/modules/clients/domain/client-timeline';

const item = (id: string, occurredAt: string, kind: TimelineDraft['kind'] = 'note'): TimelineDraft => ({
  detail: null,
  id,
  kind,
  occurredAt,
  refId: id,
  title: id,
});

describe('pageTimeline', () => {
  it('keeps the newest page and returns a cursor when more items remain', () => {
    const page = pageTimeline(
      [item('a', '2026-10-01T00:00:00.000Z'), item('c', '2026-10-03T00:00:00.000Z'), item('b', '2026-10-02T00:00:00.000Z')],
      2,
    );
    expect(page.items.map((entry) => entry.id)).toEqual(['c', 'b']);
    expect(page.nextBefore).toBe('2026-10-02T00:00:00.000Z');
    expect(page.nextBeforeId).toBe('b');
  });

  it('breaks ties by id and stops when the page is complete', () => {
    const page = pageTimeline([item('b', '2026-10-02T00:00:00.000Z'), item('a', '2026-10-02T00:00:00.000Z')], 5);
    expect(page.items.map((entry) => entry.id)).toEqual(['b', 'a']);
    expect(page.nextBefore).toBeNull();
  });
});

describe('timeline page type', () => {
  it('exposes the cursor fields', () => {
    const page: TimelinePage = pageTimeline([], 30);
    expect(page.items).toEqual([]);
  });
});
