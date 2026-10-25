import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';

type Triage = {
  atRisk: Array<{ clientId: string; inactiveDays: number | null; name: string }>;
  calls: Array<{ clientId: string; id: string; name: string; status: string; time: string }>;
  checkins: Array<{ clientId: string; fatigue: number; name: string; pain: number | null }>;
  incidents: Array<{ clientId: string; id: string; name: string; severity: string }>;
  reports: Array<{ clientId: string; id: string; name: string; weekStart: string }>;
  wearableSignals?: Array<{ clientId: string; hrvMs: number | null; name: string; sleepMinutes: number | null }>;
};

export function CoachTriageScreen(props: { onRouteChange: (route: ShellRoute) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const query = useQuery({
    enabled: Boolean(accessToken && activeRole),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'coach' }).get<Triage>('/coach/triage'),
    queryKey: ['coach', 'triage', accessToken],
  });
  const data = query.data;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{t('coach.triage.title')}</Text>
      <Column title={t('coach.triage.risk')} empty={t('coach.triage.empty')}>
        {data?.atRisk.map((row) => (
          <Row key={row.clientId} label={row.name} onPress={() => openClient(row.clientId, props.onRouteChange)} />
        ))}
      </Column>
      <Column title={t('coach.triage.checkins')} empty={t('coach.triage.empty')}>
        {data?.checkins.map((row) => (
          <Row
            key={row.clientId}
            label={`${row.name} · ${row.fatigue}`}
            onPress={() => openClient(row.clientId, props.onRouteChange)}
          />
        ))}
      </Column>
      <Column title={t('coach.triage.incidents')} empty={t('coach.triage.empty')}>
        {data?.incidents.map((row) => (
          <Row key={row.id} label={`${row.name} · ${row.severity}`} onPress={() => props.onRouteChange('coach.incidents')} />
        ))}
      </Column>
      <Column title={t('coach.triage.reports')} empty={t('coach.triage.empty')}>
        {data?.reports.map((row) => (
          <Row
            key={row.id}
            label={`${row.name} · ${row.weekStart}`}
            onPress={() => openClient(row.clientId, props.onRouteChange)}
          />
        ))}
      </Column>
      <Column title={t('coach.triage.wearables')} empty={t('coach.triage.empty')}>
        {data?.wearableSignals?.map((row) => (
          <Row
            key={row.clientId}
            label={`${row.name} · ${row.sleepMinutes ?? 0}`}
            onPress={() => openClient(row.clientId, props.onRouteChange)}
          />
        ))}
      </Column>
      <Column title={t('coach.triage.calls')} empty={t('coach.triage.empty')}>
        {data?.calls.map((row) => (
          <Row key={row.id} label={`${row.name} · ${row.time}`} onPress={() => props.onRouteChange('coach.calendar')} />
        ))}
      </Column>
      {query.isError ? <Text style={styles.muted}>{t('coach.triage.error')}</Text> : null}
    </ScrollView>
  );
}

function openClient(clientId: string, onRouteChange: (route: ShellRoute) => void): void {
  window.history.pushState({}, '', `/coach/clients/${clientId}`);
  onRouteChange('coach.clients');
}

function Column(props: { children?: React.ReactNode; empty: string; title: string }): React.JSX.Element {
  const count = React.Children.toArray(props.children).filter(Boolean).length;
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{props.title}</Text>
      {count === 0 ? <Text style={styles.muted}>{props.empty}</Text> : props.children}
    </View>
  );
}

function Row(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={props.onPress}>
      <Text style={styles.link}>{props.label}</Text>
    </Pressable>
  );
}

const styles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: space.xs,
    marginBottom: space.md,
    padding: space.md,
  },
  heading: { color: colors.text, fontSize: fontSize.md },
  link: { color: colors.primary, fontSize: fontSize.sm, paddingVertical: space.xs },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  page: { padding: space.lg },
  title: { color: colors.text, fontSize: fontSize.xl, marginBottom: space.md },
};
