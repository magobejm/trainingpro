import React, { useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { ProgressRecordsResponse, SessionView } from '@trainerpro/shared';
import { createApiClient, type ActiveRole } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import { LIGHT } from '../../theme/light';
import { WorkoutShareButton } from './WorkoutShareButton';
import {
  buildWorkoutSummary,
  formatSummaryKg,
  formatSummaryMinutes,
  recordsForSession,
  type WorkoutSummary,
} from './workout-summary';

type Props = {
  durationSeconds: number | null;
  onClose: () => void;
  recordsPending: boolean;
  session: SessionView | null;
  sessionRpe: number | null;
  visible: boolean;
};

export function WorkoutSummaryScreen(props: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const records = useSessionRecords(props.session, props.visible && !props.recordsPending);
  if (!props.visible || !props.session || props.sessionRpe == null) return null;
  const summary = buildWorkoutSummary(props.session, {
    performedDurationSeconds: props.durationSeconds,
    sessionRpe: props.sessionRpe,
  });
  return (
    <Modal animationType={'slide'} onRequestClose={props.onClose} visible>
      <ScrollView contentContainerStyle={styles.page}>
        <View collapsable={false} ref={cardRef} style={styles.card}>
          <Text style={styles.title}>{t('mobile.client.summary.title')}</Text>
          {props.session.dayTitle ? <Text style={styles.day}>{props.session.dayTitle}</Text> : null}
          <SummaryStats summary={summary} t={t} />
          <RecordList pending={props.recordsPending} records={records} t={t} />
        </View>
        <WorkoutShareButton t={t} target={cardRef} />
        <Pressable
          accessibilityLabel={t('mobile.client.summary.close')}
          accessibilityRole={'button'}
          onPress={props.onClose}
          style={styles.close}
        >
          <Text style={styles.closeText}>{t('mobile.client.summary.close')}</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

function SummaryStats(props: { summary: WorkoutSummary; t: TFunction }): React.JSX.Element {
  const minutes = formatSummaryMinutes(props.summary.durationSeconds);
  const load = props.summary.load == null ? null : formatSummaryKg(props.summary.load);
  return (
    <View style={styles.stats}>
      <Stat
        label={props.t('mobile.client.summary.tonnage')}
        value={props.t('mobile.client.summary.tonnageValue', { kg: formatSummaryKg(props.summary.tonnageKg) })}
      />
      <Stat
        label={props.t('mobile.client.summary.sets')}
        value={props.t('mobile.client.summary.setsValue', {
          done: props.summary.setsDone,
          planned: props.summary.setsPlanned,
        })}
      />
      <Stat
        label={props.t('mobile.client.summary.duration')}
        value={minutes ? props.t('mobile.client.summary.durationValue', { minutes }) : '-'}
      />
      <Stat
        label={props.t('mobile.client.summary.load')}
        value={load ? props.t('mobile.client.summary.loadValue', { load }) : '-'}
      />
    </View>
  );
}

function Stat(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
    </View>
  );
}

function RecordList(props: {
  pending: boolean;
  records: ProgressRecordsResponse['records'];
  t: TFunction;
}): React.JSX.Element {
  return (
    <View style={styles.records}>
      <Text style={styles.recordsTitle}>{props.t('mobile.client.summary.records')}</Text>
      {props.pending ? <Text style={styles.muted}>{props.t('mobile.client.summary.recordsPending')}</Text> : null}
      {!props.pending && props.records.length === 0 ? (
        <Text style={styles.muted}>{props.t('mobile.client.summary.recordsEmpty')}</Text>
      ) : null}
      {props.records.map((record) => (
        <Text key={`${record.exerciseId}:${record.e1rm}`} style={styles.record}>
          {props.t('mobile.client.summary.recordLine', { e1rm: formatSummaryKg(record.e1rm), name: record.exerciseName })}
        </Text>
      ))}
    </View>
  );
}

function useSessionRecords(session: SessionView | null, enabled: boolean): ProgressRecordsResponse['records'] {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const date = session?.sessionDate.slice(0, 10) ?? '';
  const query = useQuery({
    enabled: enabled && Boolean(accessToken && activeRole && session),
    queryFn: () => fetchRecords(accessToken ?? '', activeRole ?? 'client', date),
    queryKey: ['progress', 'records', date, session?.id],
  });
  return recordsForSession(query.data?.records ?? [], session?.id ?? '');
}

function fetchRecords(accessToken: string, activeRole: ActiveRole, date: string): Promise<ProgressRecordsResponse> {
  const params = new URLSearchParams({ from: date, to: date });
  return createApiClient({ accessToken, activeRole }).get<ProgressRecordsResponse>(`/progress/records?${params}`);
}

const styles = StyleSheet.create({
  page: { backgroundColor: LIGHT.bgSoft, flexGrow: 1, padding: 20 },
  card: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusXl, marginBottom: 16, padding: 20 },
  title: { color: LIGHT.textStrong, fontSize: 22, fontWeight: '800' },
  day: { color: LIGHT.textMuted, fontSize: 15, marginTop: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  stat: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusMd, minWidth: '46%', padding: 12 },
  statLabel: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700' },
  statValue: { color: LIGHT.textStrong, fontSize: 20, fontWeight: '800', marginTop: 4 },
  records: { marginTop: 16 },
  recordsTitle: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  muted: { color: LIGHT.textMuted, fontSize: 14 },
  record: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  close: { alignItems: 'center', padding: 12 },
  closeText: { color: LIGHT.accentDark, fontWeight: '700' },
});
