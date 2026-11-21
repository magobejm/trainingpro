import React from 'react';
import { Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createApiClient } from '../../data/api-client';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { CoachButton, CoachPage, CoachStatus, ui } from './CoachUi';
import { useReadonlyCopy } from './coach-readonly-copy';

type Assignment = {
  id: string;
  name: string;
  version: number;
  appliedAt: string;
  initial: boolean;
  active: boolean;
};
type Page = { items: Assignment[]; nextCursor: string | null };

export function CoachRoutineHistoryScreen({ clientId }: { clientId: string }) {
  const c = useReadonlyCopy();
  const auth = useCoachAuth();
  const query = useInfiniteQuery({
    enabled: Boolean(auth.accessToken && clientId),
    initialPageParam: null as string | null,
    getNextPageParam: (last: Page) => last.nextCursor ?? undefined,
    queryKey: ['coach', auth.userId, 'routine-assignments', clientId],
    queryFn: ({ pageParam }) =>
      createApiClient(auth).get<Page>(
        `/clients/${clientId}/routine-assignments${pageParam ? '?before=' + encodeURIComponent(pageParam) : ''}`,
      ),
  });
  const items = (query.data?.pages ?? []).flatMap((page) => page.items);
  return (
    <CoachPage title={c('routineHistory.title')}>
      <CoachStatus query={query} />
      {!query.isLoading && !query.isError && items.length === 0 ? (
        <Text style={ui.muted}>{c('routineHistory.empty')}</Text>
      ) : null}
      {items.map((item) => (
        <View key={item.id} style={ui.card}>
          <Text style={ui.label}>
            {`${item.name} · v${item.version}${item.active ? ' · ' + c('routineHistory.current') : ''}`}
          </Text>
          <Text style={ui.text}>{new Date(item.appliedAt).toLocaleString('es-ES')}</Text>
          {item.initial ? <Text style={ui.muted}>{c('routineHistory.initial')}</Text> : null}
        </View>
      ))}
      {query.hasNextPage ? (
        <CoachButton
          label={c('routineHistory.more')}
          loading={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        />
      ) : null}
    </CoachPage>
  );
}
