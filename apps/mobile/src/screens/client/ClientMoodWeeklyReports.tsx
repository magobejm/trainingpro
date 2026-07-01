import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientWellnessWeeklyReport } from '../../data/hooks/useClientWellness';
import { formatScore } from './client-mood.helpers';
import { LIGHT } from '../../theme/light';

type Props = { reports: ClientWellnessWeeklyReport[] };

export function MoodWeeklyReports({ reports }: Props): React.JSX.Element {
  const { t } = useTranslation();

  if (reports.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('client.mood.sections.weeklyReports')}</Text>
        <Text style={styles.empty}>{t('client.mood.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('client.mood.sections.weeklyReports')}</Text>
      {reports.map((report) => (
        <View key={report.id} style={styles.card}>
          <Text style={styles.weekLabel}>{t('client.mood.weeklyReport.weekOf', { date: report.weekStartDate })}</Text>
          <View style={styles.metrics}>
            <Metric label={t('client.mood.fields.mood')} value={formatScore(report.mood)} />
            <Metric label={t('client.mood.fields.energy')} value={formatScore(report.energy)} />
            <Metric label={t('client.mood.fields.sleep')} value={formatScore(report.sleepHours)} />
            <Metric label={t('client.mood.fields.adherence')} value={formatScore(report.adherencePercent)} />
          </View>
        </View>
      ))}
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
  empty: { color: LIGHT.textMuted, fontSize: 13 },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { color: LIGHT.accentMuted, fontSize: 9, textTransform: 'uppercase' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metricValue: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '700', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    color: LIGHT.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  weekLabel: { color: LIGHT.accentDark, fontSize: 13, fontWeight: '600' },
});
