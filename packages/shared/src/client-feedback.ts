/** Incidents and notes the coach reads from the client. Pure helpers so web and tests share the same rules. */

export type FeedbackCategoryKey = 'EXERCISE' | 'OTHER';
export type FeedbackScope = FeedbackCategoryKey | 'ALL';

/** Items older than this go to a separate drawer. */
export const FEEDBACK_RECENT_MONTHS = 4;

export type FeedbackLike = { category: FeedbackCategoryKey; createdAt: string };
export type FeedbackFilter = {
  /** Only items created within [from, to], both inclusive, as YYYY-MM-DD. */
  from?: null | string;
  query?: string;
  /** EXERCISE is what the coach sees first; ALL turns the tag filter off. */
  scope: FeedbackScope;
  to?: null | string;
};

export function feedbackCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - FEEDBACK_RECENT_MONTHS);
  return cutoff;
}

export function sortNewestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function splitByAge<T extends { createdAt: string }>(items: T[], now: Date): { older: T[]; recent: T[] } {
  const cutoff = feedbackCutoff(now).toISOString();
  const sorted = sortNewestFirst(items);
  return {
    older: sorted.filter((item) => item.createdAt < cutoff),
    recent: sorted.filter((item) => item.createdAt >= cutoff),
  };
}

/** `text` is whatever should be searchable: description, note text, exercise name. */
export function filterFeedback<T extends FeedbackLike>(
  items: T[],
  filter: FeedbackFilter,
  searchable: (item: T) => string,
): T[] {
  const query = (filter.query ?? '').trim().toLowerCase();
  return items.filter((item) => {
    if (filter.scope !== 'ALL' && item.category !== filter.scope) return false;
    const day = item.createdAt.slice(0, 10);
    if (filter.from && day < filter.from) return false;
    if (filter.to && day > filter.to) return false;
    return query === '' || searchable(item).toLowerCase().includes(query);
  });
}
