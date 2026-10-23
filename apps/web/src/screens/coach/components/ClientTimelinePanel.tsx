import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { QueryResult } from '../../../components/AsyncStatus';
import { useClientTimelineQuery } from '../../../data/hooks/useClientTimelineQuery';
import type { ClientTimelineItem } from '@trainerpro/shared';
import {
  describeTimelineItem,
  filterTimelineItems,
  groupTimeline,
  timelineKindTone,
  timelineToday,
  type TimelineBadgeTone,
  type TimelineFilter,
  type TimelineTone,
} from './timeline.helpers';

type Translate = (key: string, options?: Record<string, number | string>) => string;

const SPINNER = 'small' as const;
const SCROLL_THRESHOLD = 80;
const FILTER_PAGE_SIZE = 8;

const TONE_COLOR: Record<TimelineTone, string> = {
  danger: colors.danger,
  muted: colors.textMuted,
  primary: colors.primary,
  purple: colors.chartPurple,
  success: colors.success,
  warning: colors.warning,
};

const BADGE_STYLE: Record<TimelineBadgeTone, { backgroundColor: string; color: string }> = {
  muted: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  primary: { backgroundColor: colors.primarySoft, color: colors.primary },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
};

type Props = {
  clientId: string;
  filter: TimelineFilter;
  onOpenSession: (sessionId: string) => void;
  t: Translate;
};

export function ClientTimelinePanel(props: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const query = useClientTimelineQuery(props.clientId);
  const locale = i18n.language || 'es';
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const filtered = filterTimelineItems(items, props.filter);
  useFilterPrefetch(props.filter, filtered.length, query);
  if (query.isLoading || query.isError) return <TimelineStatus query={query} t={props.t} />;
  if (filtered.length === 0) return <TimelineEmpty fetching={Boolean(query.hasNextPage)} t={props.t} />;
  return (
    <TimelineList
      filtered={filtered}
      locale={locale}
      onOpenSession={props.onOpenSession}
      onScroll={(event) => onListScroll(event, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage)}
      t={props.t}
    />
  );
}

function useFilterPrefetch(filter: TimelineFilter, count: number, query: ReturnType<typeof useClientTimelineQuery>): void {
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = query;
  useEffect(() => {
    const needsMore = filter !== 'all' && count < FILTER_PAGE_SIZE && hasNextPage;
    if (!needsMore || isFetchingNextPage || isError) return;
    void fetchNextPage();
  }, [count, fetchNextPage, filter, hasNextPage, isError, isFetchingNextPage]);
}

function TimelineStatus(props: { query: ReturnType<typeof useClientTimelineQuery>; t: Translate }): React.JSX.Element {
  return (
    <QueryResult
      emptyIllustration={'generic'}
      emptyMessage={props.t('coach.timeline.empty')}
      emptyTitle={props.t('coach.timeline.title')}
      error={props.query.error}
      isError={props.query.isError}
      isLoading={props.query.isLoading}
      itemCount={1}
      onRetry={() => void props.query.refetch()}
      skeleton={'rows'}
    />
  );
}

function TimelineEmpty(props: { fetching: boolean; t: Translate }): React.JSX.Element {
  if (props.fetching) return <ActivityIndicator size={SPINNER} />;
  return <Text style={styles.empty}>{props.t('coach.timeline.empty')}</Text>;
}

function TimelineList(props: {
  filtered: ClientTimelineItem[];
  locale: string;
  onOpenSession: (sessionId: string) => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  t: Translate;
}): React.JSX.Element {
  const groups = groupTimeline(props.filtered, timelineToday(), props.t, props.locale);
  return (
    <div onScroll={props.onScroll} style={listStyle}>
      {groups.map((group) => (
        <View key={group.dayKey}>
          {group.monthLabel ? <Text style={styles.month}>{group.monthLabel}</Text> : null}
          <Text style={styles.day}>{group.dayLabel}</Text>
          <View style={styles.rail}>
            {group.items.map((item) => (
              <TimelineEvent
                item={item}
                key={item.id}
                locale={props.locale}
                onOpenSession={props.onOpenSession}
                t={props.t}
              />
            ))}
          </View>
        </View>
      ))}
    </div>
  );
}

function TimelineEvent(props: {
  item: ClientTimelineItem;
  locale: string;
  onOpenSession: (sessionId: string) => void;
  t: Translate;
}): React.JSX.Element {
  const card = (
    <View style={styles.event}>
      <View style={[styles.dot, { backgroundColor: TONE_COLOR[timelineKindTone(props.item.kind)] }]} />
      <EventBody item={props.item} locale={props.locale} t={props.t} />
    </View>
  );
  if (props.item.kind !== 'session') return card;
  return (
    <Pressable accessibilityRole="button" onPress={() => props.onOpenSession(props.item.refId)}>
      {card}
    </Pressable>
  );
}

function EventBody(props: { item: ClientTimelineItem; locale: string; t: Translate }): React.JSX.Element {
  const card = describeTimelineItem(props.item, props.t, props.locale);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.kind}>{props.t(`coach.timeline.kind.${props.item.kind}`)}</Text>
        {card.time ? <Text style={styles.time}>{card.time}</Text> : null}
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{card.title}</Text>
        {card.badge && card.badgeTone ? <Badge label={card.badge} tone={card.badgeTone} /> : null}
      </View>
      {card.detail ? <Text style={styles.detail}>{card.detail}</Text> : null}
    </View>
  );
}

function Badge(props: { label: string; tone: TimelineBadgeTone }): React.JSX.Element {
  return <Text style={[styles.badge, BADGE_STYLE[props.tone]]}>{props.label}</Text>;
}

function onListScroll(
  event: React.UIEvent<HTMLDivElement>,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => Promise<unknown>,
): void {
  const element = event.currentTarget;
  const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
  if (remaining > SCROLL_THRESHOLD || !hasNextPage || isFetchingNextPage) return;
  void fetchNextPage();
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  overflowY: 'auto',
  paddingBottom: 24,
  paddingRight: 4,
};

const styles = StyleSheet.create({
  badge: { borderRadius: radius.sm, fontSize: fontSize.xs, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2 },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flex: 1,
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  day: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800', marginLeft: 28, marginTop: space.md },
  detail: { color: colors.textMuted, fontSize: fontSize.xs },
  dot: {
    borderColor: colors.surface,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    left: -7,
    position: 'absolute',
    top: 14,
    width: 12,
  },
  empty: { color: colors.textMuted, fontSize: fontSize.sm, paddingVertical: space.lg },
  event: { paddingBottom: space.sm, position: 'relative' },
  kind: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.4 },
  month: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', marginLeft: 28, marginTop: space.lg },
  rail: { borderLeftColor: colors.border, borderLeftWidth: 2, marginLeft: 10, paddingLeft: 16 },
  time: { color: colors.textMuted, fontSize: fontSize.xs },
  title: { color: colors.text, flex: 1, fontSize: fontSize.sm, fontWeight: '700' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
});
