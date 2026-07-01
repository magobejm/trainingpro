import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientWellnessSummary } from '../../data/hooks/useClientWellness';
import { formatScore } from './client-mood.helpers';
import { LIGHT } from '../../theme/light';

type Props = { summary: ClientWellnessSummary };

export function MoodKpiStrip({ summary }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const items = [
    { id: 'mood', label: t('client.mood.kpi.avgMood'), value: formatScore(summary.avgPostMood) },
    { id: 'motivation', label: t('client.mood.kpi.avgMotivation'), value: formatScore(summary.avgPreMotivation) },
    { id: 'fatigue', label: t('client.mood.kpi.avgFatigue'), value: formatScore(summary.avgPostFatigue) },
    {
      id: 'sessions',
      label: t('client.mood.kpi.sessionsCount'),
      value: String(summary.sessionsWithWellness),
    },
  ];
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.id} style={styles.chip}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 12,
  },
  label: { color: LIGHT.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  value: { color: LIGHT.textStrong, fontSize: 20, fontWeight: '800' },
});
