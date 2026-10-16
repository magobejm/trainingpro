import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ClientCardRow } from '@trainerpro/ui';
import type { ClientListResponse, ClientView } from '@trainerpro/shared';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { CoachButton, CoachField, CoachSelect, CoachStatus } from '../../features/coach/CoachUi';
import { LIGHT } from '../../theme/light';
import { useCoachCopy } from './coach-copy';
import { filterCoachClients, type ClientOrder } from './coach-client-model';
export const coachClientPalette = {
  background: LIGHT.bgCard,
  text: LIGHT.textStrong,
  muted: LIGHT.textMuted,
  border: LIGHT.border,
  accent: LIGHT.accent,
  soft: LIGHT.accentSoft,
};
export function CoachClientsScreen(props: {
  onSelect: (id: string) => void;
  onCreate?: () => void;
  selecting?: boolean;
}): React.JSX.Element {
  const c = useCoachCopy();
  const query = useCoachQuery<ClientListResponse>('/clients');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<ClientOrder>('name');
  const [objective, setObjective] = useState('');
  const [status, setStatus] = useState('');
  const rows = useMemo(
    () =>
      filterCoachClients(query.data?.items ?? [], search, 'all', order).filter(
        (item) => (!objective || item.objectiveId === objective) && (!status || (item.status?.level ?? 'none') === status),
      ),
    [query.data, search, order, objective, status],
  );
  const goals = Array.from(
    new Map((query.data?.items ?? []).map((item) => [item.objectiveId, item.objective])).entries(),
  ).map(([value, label]) => ({ value, label }));
  return (
    <View style={styles.root}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={'handled'}
        ListHeaderComponent={
          <View style={styles.header}>
            <CoachField label={c('search')} value={search} onChange={setSearch} />
            <CoachSelect
              label={c('sort')}
              value={order}
              onChange={(v) => setOrder(v as ClientOrder)}
              options={[
                { value: 'name', label: c('name') },
                { value: 'activity', label: c('activity') },
              ]}
            />
            <CoachSelect
              label={c('objective')}
              value={objective}
              onChange={setObjective}
              options={[{ value: '', label: c('all') }, ...goals]}
            />
            <CoachSelect
              label={c('status')}
              value={status}
              onChange={setStatus}
              options={['', 'green', 'amber', 'red', 'none'].map((value) => ({
                value,
                label: c((value || 'all') as 'all' | 'green' | 'amber' | 'red' | 'none'),
              }))}
            />
            {props.onCreate ? <CoachButton label={c('newClient')} onPress={props.onCreate} /> : null}
            <CoachStatus query={query} />
          </View>
        }
        ListEmptyComponent={!query.isLoading ? <CoachStatus query={{ ...query, data: [] }} empty={true} /> : null}
        renderItem={({ item }) => (
          <ClientCardRow
            vertical
            palette={coachClientPalette}
            items={[clientCardItem(item, c)]}
            onItemPress={props.onSelect}
          />
        )}
      />
    </View>
  );
}
export function clientCardItem(client: ClientView, c: ReturnType<typeof useCoachCopy>) {
  const level = client.status?.level ?? 'none';
  return {
    id: client.id,
    title: [client.firstName, client.lastName].join(' '),
    subtitle: client.email,
    objective: client.objective,
    avatarUrl: client.avatarUrl,
    statusLabel: c(level),
    statusTone:
      level === 'red'
        ? ('danger' as const)
        : level === 'amber'
          ? ('warning' as const)
          : level === 'green'
            ? ('success' as const)
            : ('neutral' as const),
  };
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT.bgSoft },
  content: { gap: 12, padding: 20, paddingBottom: 112 },
  header: { gap: 12 },
});
