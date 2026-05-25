import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientMe } from '../../data/hooks/useClientMeQuery';
import { computeBmi, formatMetric } from './client-measures.helpers';

type Props = { client: ClientMe };

export function MeasuresGrid({ client }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const bmi = computeBmi(client.heightCm, client.weightKg);

  return (
    <View style={styles.grid}>
      <MeasureCard label={t('client.measures.fields.height')} value={formatMetric(client.heightCm, 'cm')} />
      <MeasureCard label={t('client.measures.fields.weight')} value={formatMetric(client.weightKg, 'kg')} />
      <MeasureCard label={t('client.measures.fields.waist')} value={formatMetric(client.waistCm, 'cm')} />
      <MeasureCard label={t('client.measures.fields.hip')} value={formatMetric(client.hipCm, 'cm')} />
      <MeasureCard label={t('client.measures.fields.sex')} value={client.sex ?? '–'} />
      {bmi !== null ? <MeasureCard label={t('client.measures.fields.bmi')} value={formatMetric(bmi, '')} /> : null}
      <MeasureCard label={t('client.measures.fields.fcMax')} value={formatMetric(client.fcMax, 'bpm')} />
      <MeasureCard label={t('client.measures.fields.fcRest')} value={formatMetric(client.fcRest, 'bpm')} />
    </View>
  );
}

function MeasureCard(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.label}</Text>
      <Text style={styles.value}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(168,85,247,0.2)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  label: { color: 'rgba(196,181,253,0.7)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
  value: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
});
