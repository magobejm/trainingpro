import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClientListResponse } from '@trainerpro/shared';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { CoachPage, CoachButton, CoachStatus } from '../../features/coach/CoachUi';
import { LIGHT } from '../../theme/light';
import { useCoachCopy } from './coach-copy';
export function CoachHomeScreen(props: {
  onOpen: (feature: string, clientId?: string) => void;
  onClients: () => void;
  onCreate: () => void;
}): React.JSX.Element {
  const c = useCoachCopy();
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join(
    '-',
  );
  const agenda = useCoachQuery<{ data: Array<{ id: string; title?: string; time?: string; type: string }> }>(
    '/calendar?' + new URLSearchParams({ dateFrom: date, dateTo: date }),
  );
  const clients = useCoachQuery<ClientListResponse>('/clients');
  const incidents = useCoachQuery<Array<{ id: string; status: string; description: string }>>('/incidents');
  const open = incidents.data?.filter((item) => item.status === 'OPEN') ?? [];
  return (
    <CoachPage title={c('home')}>
      <Text style={styles.title}>{c('today')}</Text>
      <Text style={styles.subtitle}>{now.toLocaleDateString()}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.value}>{clients.data?.items.length ?? '–'}</Text>
          <Text style={styles.subtitle}>{c('clients')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>{open.length}</Text>
          <Text style={styles.subtitle}>{c('openIncidents')}</Text>
        </View>
      </View>
      <CoachStatus query={clients} />
      <CoachStatus query={incidents} />
      <CoachButton label={c('openIncidents')} onPress={() => props.onOpen('incidents')} />
      <Text style={styles.title}>{c('agendaToday')}</Text>
      <CoachStatus query={agenda} />
      {agenda.data?.data.length === 0 ? <Text style={styles.subtitle}>{c('noEvents')}</Text> : null}
      {agenda.data?.data.map((item) => (
        <View key={item.id} style={styles.event}>
          <Text style={styles.text}>{[item.time, item.title || item.type].filter(Boolean).join(' · ')}</Text>
        </View>
      ))}
      <CoachButton label={c('calendar')} onPress={() => props.onOpen('calendar')} />
      <Text style={styles.title}>{c('quick')}</Text>
      <CoachButton label={c('clients')} onPress={props.onClients} />
      <CoachButton label={c('newClient')} onPress={props.onCreate} />
      <CoachButton label={c('routines')} onPress={() => props.onOpen('routines')} />
      <CoachButton label={c('nutrition')} onPress={() => props.onOpen('nutrition')} />
    </CoachPage>
  );
}
const styles = StyleSheet.create({
  title: { color: LIGHT.textStrong, fontSize: 20, fontWeight: '800' },
  subtitle: { color: LIGHT.textMuted, fontSize: 14 },
  text: { color: LIGHT.text, fontSize: 16 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    padding: 20,
    gap: 6,
    borderRadius: LIGHT.radiusLg,
    backgroundColor: LIGHT.bgCard,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  value: { color: LIGHT.accentDark, fontSize: 28, fontWeight: '800' },
  event: { padding: 16, backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusMd },
});
