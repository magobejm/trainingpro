export const TIMELINE_DEFAULT_LIMIT = 30;
export const TIMELINE_MAX_LIMIT = 50;

export type TimelineKind = 'chat' | 'incident' | 'note' | 'photo' | 'session' | 'test';

export type TimelineDraft = {
  outcome?: import('@trainerpro/shared').SessionOutcome;
  sessionDate?: string;
  originDate?: string | null;
  skipReason?: string | null;
  detail: string | null;
  id: string;
  kind: TimelineKind;
  occurredAt: string;
  refId: string;
  title: string;
};

export type TimelineCursor = { at: string; id: string } | null;

export type TimelinePage = {
  items: TimelineDraft[];
  nextBefore: string | null;
  nextBeforeId: string | null;
};

/** Mezcla fuentes ya recortadas y deja la página más reciente, con cursor para la siguiente. */
export function pageTimeline(items: TimelineDraft[], limit: number): TimelinePage {
  const sorted = [...items].sort(compareDesc);
  const page = sorted.slice(0, limit);
  const last = page.at(-1);
  const hasMore = sorted.length > limit;
  return {
    items: page,
    nextBefore: hasMore && last ? last.occurredAt : null,
    nextBeforeId: hasMore && last ? last.id : null,
  };
}

export function isBeforeCursor(item: { id: string; occurredAt: string }, cursor: TimelineCursor): boolean {
  if (!cursor) return true;
  if (item.occurredAt < cursor.at) return true;
  return item.occurredAt === cursor.at && item.id < cursor.id;
}

function compareDesc(left: TimelineDraft, right: TimelineDraft): number {
  if (left.occurredAt !== right.occurredAt) return left.occurredAt < right.occurredAt ? 1 : -1;
  if (left.id === right.id) return 0;
  return left.id < right.id ? 1 : -1;
}
