import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ClientTimelineItem, ClientTimelineResponse } from '@trainerpro/shared';
import { useTranslation } from 'react-i18next';
import { createApiClient } from '../../data/api-client';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { LIGHT } from '../../theme/light';
import { CoachButton, CoachPage, CoachStatus, ui } from './CoachUi';
import { useReadonlyCopy, type ReadonlyCopyKey } from './coach-readonly-copy';
import {
  TIMELINE_FILTERS,
  filterTimelineItems,
  groupTimelineByDay,
  timelineDayLabel,
  type TimelineFilter,
} from './coach-timeline-model';

type Cursor = { before: string; beforeId: string } | null;
type Copy = ReturnType<typeof useReadonlyCopy>;

export function CoachTimelineScreen({ clientId }: { clientId: string }) {
  const c = useReadonlyCopy();
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const { t, i18n } = useTranslation();
  const auth = useCoachAuth();
  const locale = i18n.language || 'es';
  const query = useInfiniteQuery({
    enabled: Boolean(auth.accessToken && clientId),
    initialPageParam: null as Cursor,
    getNextPageParam: (last: ClientTimelineResponse) =>
      last.nextBefore && last.nextBeforeId ? { before: last.nextBefore, beforeId: last.nextBeforeId } : undefined,
    queryKey: ['coach', auth.userId, 'timeline', clientId],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '30', includeOutcome: 'true' });
      if (pageParam) {
        params.set('before', pageParam.before);
        params.set('beforeId', pageParam.beforeId);
      }
      return createApiClient(auth).get<ClientTimelineResponse>(`/clients/${clientId}/timeline?${params}`);
    },
  });
  const items = filterTimelineItems(
    (query.data?.pages ?? []).flatMap((page) => page.items),
    filter,
  );
  const groups = groupTimelineByDay(items);
  const now = new Date();
  return (
    <CoachPage title={c('timeline.title')}>
      <View style={styles.filters}>
        {TIMELINE_FILTERS.map((value) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: value === filter }}
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filter, value === filter && styles.filterOn]}
          >
            <Text style={[styles.filterText, value === filter && styles.filterTextOn]}>
              {c(('timeline.filter.' + value) as ReadonlyCopyKey)}
            </Text>
          </Pressable>
        ))}
      </View>
      <CoachStatus query={query} empty={!query.isLoading && items.length === 0} />
      {groups.map((group) => (
        <View key={group.dayKey} style={ui.field}>
          <Text style={ui.label}>
            {timelineDayLabel(group.dayKey, now, { today: c('timeline.today'), yesterday: c('timeline.yesterday') }, locale)}
          </Text>
          {group.items.map((item) => (
            <View key={item.id} style={ui.card}>
              <Text style={ui.muted}>
                {c(('timeline.kind.' + item.kind) as ReadonlyCopyKey)}
                {timeOf(item, locale) ? ' · ' + timeOf(item, locale) : ''}
              </Text>
              <Text style={ui.label}>{itemTitle(item, c)}</Text>
              {item.kind === 'session' && item.outcome ? (
                <Text style={ui.text}>{t('training.outcome.' + item.outcome)}</Text>
              ) : null}
              {itemDetail(item, c, t, locale) ? <Text style={ui.muted}>{itemDetail(item, c, t, locale)}</Text> : null}
            </View>
          ))}
        </View>
      ))}
      {query.hasNextPage ? (
        <CoachButton
          label={c('timeline.more')}
          loading={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        />
      ) : null}
    </CoachPage>
  );
}

function timeOf(item: ClientTimelineItem, locale: string): string {
  if (!item.occurredAt.includes('T')) return '';
  const date = new Date(item.occurredAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function itemTitle(item: ClientTimelineItem, c: Copy): string {
  if (item.kind === 'chat') return c('timeline.messages', { count: item.detail ?? '0' });
  return item.title || c(('timeline.kind.' + item.kind) as ReadonlyCopyKey);
}

function itemDetail(item: ClientTimelineItem, c: Copy, t: (key: string) => string, locale: string): string {
  if (item.kind === 'chat') return '';
  if (item.kind === 'session') {
    const parts: string[] = [];
    if (item.originDate) {
      const date = new Date(item.originDate + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      parts.push(c('timeline.origin', { date }));
    }
    if (item.skipReason) parts.push(c('timeline.reason', { reason: item.skipReason }));
    return parts.join(' · ');
  }
  if (item.kind === 'incident' && item.detail === 'reviewed') return c('timeline.reviewed');
  if (!item.detail || item.detail === 'reviewed') return '';
  const [head, ...rest] = item.detail.split(' · ');
  const severity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(head ?? '') ? t('coachWorkspace.severity.' + head) : head;
  return [severity, ...rest].join(' · ');
}

const styles = StyleSheet.create({
  filter: {
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterOn: { backgroundColor: LIGHT.accentSoft, borderColor: LIGHT.accent },
  filterText: { color: LIGHT.textMuted, fontSize: 13 },
  filterTextOn: { color: LIGHT.accent, fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
