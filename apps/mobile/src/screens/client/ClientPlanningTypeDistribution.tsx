import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { TYPE_BADGE, type TypeCount } from './client-planning.helpers';

type Props = {
  counts: TypeCount[];
  total: number;
};

export function TypeDistribution({ counts, total }: Props): React.JSX.Element {
  const { t } = useTranslation();
  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('client.planning.typeDistribution')}</Text>
        <Text style={styles.empty}>{t('client.planning.noExercises')}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('client.planning.typeDistribution')}</Text>
      <View style={styles.bar}>
        {counts.map((tc) => (
          <View key={tc.type} style={[styles.barSegment, { backgroundColor: TYPE_BADGE[tc.type].text, flex: tc.count }]} />
        ))}
      </View>
      <View style={styles.legend}>
        {counts.map((tc) => (
          <View key={tc.type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: TYPE_BADGE[tc.type].text }]} />
            <Text style={styles.legendText}>{`${TYPE_BADGE[tc.type].label} · ${String(tc.count)}`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 6,
    flexDirection: 'row',
    height: 10,
    marginVertical: 8,
    overflow: 'hidden',
  },
  barSegment: { height: '100%' },
  container: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
  },
  empty: { color: 'rgba(196,181,253,0.5)', fontSize: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  legendDot: { borderRadius: 5, height: 10, marginRight: 4, width: 10 },
  legendItem: { alignItems: 'center', flexDirection: 'row' },
  legendText: { color: '#c4b5fd', fontSize: 11 },
  title: { color: '#c4b5fd', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
