import type { ClientTimelineItem } from '@trainerpro/shared';

type Translate = (key: string, options?: Record<string, number | string>) => string;

export const TIMELINE_FILTERS = ['all', 'session', 'chat', 'note', 'incident', 'test', 'photo', 'nutrition'] as const;
export type TimelineFilter = (typeof TIMELINE_FILTERS)[number];
export type TimelineTone = 'danger' | 'muted' | 'primary' | 'purple' | 'success' | 'warning';
export type TimelineBadgeTone = 'muted' | 'primary' | 'success' | 'warning';

export type TimelineDayGroup = {
  dayKey: string;
  dayLabel: string;
  items: ClientTimelineItem[];
  monthLabel: null | string;
};

export type TimelineCardModel = {
  badge: null | string;
  badgeTone: null | TimelineBadgeTone;
  detail: string;
  time: string;
  title: string;
};

export function timelineToday(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function filterTimelineItems(items: ClientTimelineItem[], filter: TimelineFilter): ClientTimelineItem[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.kind === filter);
}

export function groupTimeline(items: ClientTimelineItem[], today: string, t: Translate, locale: string): TimelineDayGroup[] {
  const groups: TimelineDayGroup[] = [];
  for (const item of items) pushTimelineItem(groups, item, today, t, locale);
  return groups;
}

export function timelineKindTone(kind: ClientTimelineItem['kind']): TimelineTone {
  if (kind === 'session') return 'warning';
  if (kind === 'chat') return 'primary';
  if (kind === 'note') return 'purple';
  if (kind === 'incident') return 'danger';
  if (kind === 'test') return 'success';
  if (kind === 'nutrition') return 'primary';
  return 'muted';
}

export function describeTimelineItem(item: ClientTimelineItem, t: Translate, locale: string): TimelineCardModel {
  return {
    badge: badgeLabel(item, t),
    badgeTone: readBadgeTone(item),
    detail: detailLine(item, t, locale),
    time: formatEventTime(item.occurredAt, locale),
    title: cardTitle(item, t),
  };
}

export function lastEventLine(item: ClientTimelineItem, t: Translate, today: string, locale: string): string {
  return t('coach.timeline.last', {
    what: lastEventWhat(item, t),
    when: formatTimelineDayLabel(timelineDay(item), today, t, locale),
  });
}

export function formatEventTime(occurredAt: string, locale: string): string {
  if (!occurredAt.includes('T')) return '';
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function pushTimelineItem(
  groups: TimelineDayGroup[],
  item: ClientTimelineItem,
  today: string,
  t: Translate,
  locale: string,
): void {
  const dayKey = timelineDay(item);
  const current = groups[groups.length - 1];
  if (current && current.dayKey === dayKey) {
    current.items.push(item);
    return;
  }
  groups.push(createDayGroup(current, dayKey, item, today, t, locale));
}

function createDayGroup(
  current: TimelineDayGroup | undefined,
  dayKey: string,
  item: ClientTimelineItem,
  today: string,
  t: Translate,
  locale: string,
): TimelineDayGroup {
  const month = dayKey.slice(0, 7);
  const previousMonth = current ? current.dayKey.slice(0, 7) : '';
  return {
    dayKey,
    dayLabel: formatTimelineDayLabel(dayKey, today, t, locale),
    items: [item],
    monthLabel: month === previousMonth ? null : formatMonthLabel(dayKey, locale),
  };
}

function formatTimelineDayLabel(day: string, today: string, t: Translate, locale: string): string {
  if (day === today) return t('coach.timeline.today');
  if (day === shiftDateKey(today, -1)) return t('coach.timeline.yesterday');
  const formatted = dateFromKey(day).toLocaleDateString(locale, { day: 'numeric', month: 'short', weekday: 'long' });
  return capitalize(formatted, locale);
}

function formatMonthLabel(day: string, locale: string): string {
  const formatted = dateFromKey(day).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return capitalize(formatted, locale);
}

function timelineDay(item: ClientTimelineItem): string {
  return (item.sessionDate ?? item.occurredAt).slice(0, 10);
}

function shiftDateKey(day: string, delta: number): string {
  const date = dateFromKey(day);
  date.setDate(date.getDate() + delta);
  return timelineToday(date);
}

function dateFromKey(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
}

function capitalize(value: string, locale: string): string {
  const cleaned = value.replace(',', '');
  return cleaned.charAt(0).toLocaleUpperCase(locale) + cleaned.slice(1);
}

function cardTitle(item: ClientTimelineItem, t: Translate): string {
  if (item.kind === 'chat') return t('coach.timeline.messages', { count: item.detail ?? '0' });
  return item.title || t(`coach.timeline.kind.${item.kind}`);
}

function badgeLabel(item: ClientTimelineItem, t: Translate): null | string {
  if (item.kind !== 'session' || !item.outcome) return null;
  return t(`training.outcome.${item.outcome}`);
}

function readBadgeTone(item: ClientTimelineItem): null | TimelineBadgeTone {
  if (item.kind !== 'session' || !item.outcome) return null;
  if (item.outcome === 'done') return 'success';
  if (item.outcome === 'incomplete') return 'warning';
  if (item.outcome === 'in_progress') return 'primary';
  return 'muted';
}

function detailLine(item: ClientTimelineItem, t: Translate, locale: string): string {
  if (item.kind === 'chat') return '';
  if (item.kind === 'session') return sessionDetail(item, t, locale);
  if (item.kind === 'incident' && item.detail === 'reviewed') return t('coach.timeline.reviewed');
  return extraDetail(item.detail, t);
}

function sessionDetail(item: ClientTimelineItem, t: Translate, locale: string): string {
  const parts: string[] = [];
  if (item.originDate) parts.push(t('coach.timeline.origin', { date: formatShortDate(item.originDate, locale) }));
  if (item.skipReason) parts.push(t('coach.timeline.reason', { reason: item.skipReason }));
  return parts.join(' · ');
}

function formatShortDate(day: string, locale: string): string {
  return dateFromKey(day).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function extraDetail(detail: null | string, t: Translate): string {
  if (!detail || detail === 'reviewed') return '';
  const [head, ...rest] = detail.split(' · ');
  if (!head) return '';
  return [translatedDetail(head, t), ...rest].join(' · ');
}

function translatedDetail(head: string, t: Translate): string {
  if (head === 'incomplete') return t('coach.timeline.incomplete');
  if (head === 'skipped') return t('coach.timeline.skipped');
  return head;
}

function lastEventWhat(item: ClientTimelineItem, t: Translate): string {
  if (item.kind === 'chat') return t('coach.timeline.messages', { count: item.detail ?? '0' });
  const kind = t(`coach.timeline.kind.${item.kind}`);
  const title = item.title ? `${kind} ${item.title}` : kind;
  if (item.kind === 'session' && item.outcome) return `${title} · ${t(`training.outcome.${item.outcome}`)}`;
  return title;
}
