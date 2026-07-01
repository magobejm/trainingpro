import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientWellnessSession } from '../../data/hooks/useClientWellness';
import { MOOD_EMOJI, formatDateLabel, formatScore, hasWellnessData } from './client-mood.helpers';
import { LIGHT } from '../../theme/light';

type Props = { sessions: ClientWellnessSession[] };

export function MoodSessionList({ sessions }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const withData = sessions.filter(hasWellnessData);

  if (withData.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('client.mood.sections.sessions')}</Text>
        <Text style={styles.empty}>{t('client.mood.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('client.mood.sections.sessions')}</Text>
      {withData.map((session) => (
        <SessionRow key={session.id} session={session} t={t} />
      ))}
    </View>
  );
}

function SessionRow(props: { session: ClientWellnessSession; t: (key: string) => string }): React.JSX.Element {
  const { session, t } = props;
  const moodEmoji = session.postMood !== null && session.postMood !== undefined ? MOOD_EMOJI[session.postMood] : null;
  const title = session.planDayTitle ?? formatDateLabel(session.sessionDate);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {moodEmoji ? <Text style={styles.emoji}>{moodEmoji}</Text> : null}
      </View>
      <Text style={styles.date}>{formatDateLabel(session.sessionDate)}</Text>
      <View style={styles.metrics}>
        <Metric label={t('client.mood.fields.motivation')} value={formatScore(session.preMotivation)} />
        <Metric label={t('client.mood.fields.recovery')} value={formatScore(session.preRecovery)} />
        <Metric label={t('client.mood.fields.fatigue')} value={formatScore(session.postFatigue)} />
        <Metric label={t('client.mood.fields.pain')} value={formatScore(session.postPain)} />
      </View>
    </View>
  );
}

function Metric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  date: { color: LIGHT.textMuted, fontSize: 11, marginBottom: 8 },
  emoji: { fontSize: 22 },
  empty: { color: LIGHT.textMuted, fontSize: 13 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { color: LIGHT.accentMuted, fontSize: 9, textTransform: 'uppercase' },
  metrics: { flexDirection: 'row', gap: 8 },
  metricValue: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '700', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    color: LIGHT.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: { color: LIGHT.textStrong, flex: 1, fontSize: 15, fontWeight: '700' },
});
