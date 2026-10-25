import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { createApiClient, type ActiveRole } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';

type Wearables = {
  activities: Array<{ durationS: number; id: string; source: string; sportType: string }>;
  connections: Array<{ provider: string; status: string }>;
  metrics: Array<{ date: string; hrvMs: number | null; sleepMinutes: number | null; source: string; steps: number | null }>;
};

const SAMPLE_BLOCK = {
  blocks: [{ displayName: 'Series', fcReservePct: 70, restSeconds: 60, roundsPlanned: 4, workSeconds: 180 }],
  name: 'Series',
  routineKey: 'preview',
};

export function ClientWearablesPanel(props: { clientId: string; t: (key: string) => string }): React.JSX.Element | null {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    enabled: Boolean(props.clientId && accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'coach' }).get<Wearables>(
        `/clients/${props.clientId}/wearables`,
      ),
    queryKey: ['coach', 'wearables', props.clientId],
  });
  if (!props.clientId) return null;
  const data = query.data;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{props.t('coach.wearables.title')}</Text>
      {data && data.metrics.length === 0 && data.activities.length === 0 ? (
        <Text style={styles.muted}>{props.t('coach.wearables.empty')}</Text>
      ) : null}
      {data?.connections.map((row) => (
        <Text key={row.provider} style={styles.line}>{`${row.provider} · ${row.status}`}</Text>
      ))}
      {data?.metrics.slice(0, 3).map((row) => (
        <Text key={`${row.date}-${row.source}`} style={styles.line}>
          {`${row.date} · ${row.source} · ${row.steps ?? 0} · ${row.sleepMinutes ?? 0}`}
        </Text>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => void send(props.clientId, accessToken, activeRole, setNotice, props.t)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{props.t('coach.wearables.watch')}</Text>
      </Pressable>
      {notice ? <Text style={styles.muted}>{notice}</Text> : null}
    </View>
  );
}

async function send(
  clientId: string,
  accessToken: string | null,
  activeRole: ActiveRole | null,
  setNotice: (value: string) => void,
  t: (key: string) => string,
): Promise<void> {
  try {
    const result = await createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'coach' }).post<{
      status: string;
    }>(`/clients/${clientId}/garmin/workouts`, SAMPLE_BLOCK);
    const key =
      result.status === 'unlinked'
        ? 'coach.wearables.unlinked'
        : result.status === 'sent'
          ? 'coach.wearables.sent'
          : 'coach.wearables.simulated';
    setNotice(t(key));
  } catch {
    setNotice(t('coach.wearables.retry'));
  }
}

const styles = {
  button: { backgroundColor: colors.primary, borderRadius: radius.md, marginTop: space.sm, padding: space.sm },
  buttonText: { color: colors.onPrimary, fontSize: fontSize.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: space.xs, marginTop: space.md, padding: space.md },
  line: { color: colors.text, fontSize: fontSize.sm },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.md },
};
