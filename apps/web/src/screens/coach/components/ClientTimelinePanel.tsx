import React, { useState } from 'react';
import { SessionDetailModal } from '../progress/SessionDetailModal';
import { StyleSheet, Text, View } from 'react-native';
import { Button, colors, fontSize, space } from '@trainerpro/ui';
import { QueryResult } from '../../../components/AsyncStatus';
import { useClientTimelineQuery } from '../../../data/hooks/useClientTimelineQuery';
import type { ClientTimelineItem } from '@trainerpro/shared';

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function ClientTimelinePanel(props: { clientId: string; t: Translate }): React.JSX.Element {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const query = useClientTimelineQuery(props.clientId);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  if (query.isLoading || query.isError || items.length === 0) {
    return (
      <QueryResult
        emptyIllustration={'generic'}
        emptyMessage={props.t('coach.timeline.empty')}
        emptyTitle={props.t('coach.timeline.title')}
        error={query.error}
        isError={query.isError}
        isLoading={query.isLoading}
        itemCount={items.length}
        onRetry={() => void query.refetch()}
        skeleton={'rows'}
      />
    );
  }
  return (
    <View style={styles.list}>
      {groupByDay(items).map((group) => (
        <View key={group.day}>
          <Text style={styles.day}>{group.day}</Text>
          {group.items.map((item) => (
            <Text
              key={item.id}
              accessibilityRole={item.kind === 'session' ? 'button' : undefined}
              onPress={item.kind === 'session' ? () => setSessionId(item.refId) : undefined}
              style={styles.item}
            >
              {itemLabel(item, props.t)}
            </Text>
          ))}
        </View>
      ))}
      <SessionDetailModal sessionId={sessionId} onClose={() => setSessionId(null)} />
      {query.hasNextPage ? (
        <Button
          label={props.t('coach.timeline.more')}
          onPress={() => void query.fetchNextPage()}
          size="sm"
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

function groupByDay(items: ClientTimelineItem[]): Array<{ day: string; items: ClientTimelineItem[] }> {
  const groups: Array<{ day: string; items: ClientTimelineItem[] }> = [];
  for (const item of items) {
    const day = (item.sessionDate ?? item.occurredAt).slice(0, 10);
    const current = groups[groups.length - 1];
    if (current && current.day === day) current.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

function itemLabel(item: ClientTimelineItem, t: Translate): string {
  const kind = t(`coach.timeline.kind.${item.kind}`);
  if (item.kind === 'chat') return `${kind}: ${t('coach.timeline.messages', { count: item.detail ?? '0' })}`;
  if (item.kind === 'incident' && item.detail === 'reviewed') return `${t('coach.timeline.reviewed')}: ${item.title}`;
  const extra = item.outcome
    ? ` · ${t('training.outcome.' + item.outcome)}${item.originDate ? ' · ' + t('training.originDate') + ': ' + item.originDate.slice(0, 10) : ''}${item.skipReason ? ' · ' + item.skipReason : ''}`
    : timelineDetail(item.detail, t);
  return item.title ? `${kind}: ${item.title}${extra}` : kind;
}

function timelineDetail(detail: string | null, t: Translate): string {
  if (!detail || detail === 'reviewed') return '';
  const [head, ...rest] = detail.split(' · ');
  if (!head) return '';
  const label = translatedDetail(head, t);
  return ` · ${[label, ...rest].join(' · ')}`;
}

function translatedDetail(head: string, t: Translate): string {
  if (head === 'incomplete') return t('coach.timeline.incomplete');
  if (head === 'skipped') return t('coach.timeline.skipped');
  return head;
}

const styles = StyleSheet.create({
  day: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', marginTop: space.sm },
  item: { color: colors.text, fontSize: fontSize.sm },
  list: { gap: space.xs, paddingBottom: space.sm, paddingHorizontal: space.md },
});
