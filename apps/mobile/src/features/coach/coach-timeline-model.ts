import type { ClientTimelineItem } from '@trainerpro/shared';

export type TimelineDayGroup = { dayKey: string; items: ClientTimelineItem[] };
export const TIMELINE_FILTERS = ['all', 'session', 'chat', 'note', 'incident', 'test', 'photo', 'nutrition'] as const;
export type TimelineFilter = (typeof TIMELINE_FILTERS)[number];

export function filterTimelineItems(items: ClientTimelineItem[], filter: TimelineFilter): ClientTimelineItem[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.kind === filter);
}

function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function timelineDay(item: ClientTimelineItem): string {
  if (item.occurredAt.includes('T')) {
    const occurred = new Date(item.occurredAt);
    if (!Number.isNaN(occurred.getTime())) return localDayKey(occurred);
  }
  return (item.sessionDate ?? item.occurredAt).slice(0, 10);
}

export function groupTimelineByDay(items: ClientTimelineItem[]): TimelineDayGroup[] {
  const groups: TimelineDayGroup[] = [];
  for (const item of items) {
    const dayKey = timelineDay(item);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) last.items.push(item);
    else groups.push({ dayKey, items: [item] });
  }
  return groups;
}

export function timelineDayLabel(
  dayKey: string,
  now: Date,
  labels: { today: string; yesterday: string },
  locale: string,
): string {
  if (dayKey === localDayKey(now)) return labels.today;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey === localDayKey(yesterday)) return labels.yesterday;
  const [year, month, day] = dayKey.split('-').map(Number);
  const text = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    weekday: 'long',
  });
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
