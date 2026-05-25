import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientWellnessSession } from '../../data/hooks/useClientWellness';
import { MOOD_EMOJI, formatDateLabel, formatScore, hasWellnessData } from './client-mood.helpers';

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
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(168,85,247,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  date: { color: 'rgba(196,181,253,0.6)', fontSize: 11, marginBottom: 8 },
  emoji: { fontSize: 22 },
  empty: { color: 'rgba(196,181,253,0.5)', fontSize: 13 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { color: 'rgba(196,181,253,0.6)', fontSize: 9, textTransform: 'uppercase' },
  metrics: { flexDirection: 'row', gap: 8 },
  metricValue: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    color: 'rgba(196,181,253,0.7)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: { color: '#ffffff', flex: 1, fontSize: 15, fontWeight: '700' },
});
