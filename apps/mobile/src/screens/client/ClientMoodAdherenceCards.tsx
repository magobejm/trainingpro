import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';

type Props = {
  nutritionAssigned: boolean;
  nutritionPercent: null | number;
  trainingAssigned: boolean;
  trainingPercent: null | number;
};

function AdherenceCard(props: { assigned: boolean; label: string; percent: null | number }): React.JSX.Element {
  const { t } = useTranslation();
  const value = !props.assigned ? t('client.mood.adherence.notAssigned') : formatPercent(props.percent);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.label}</Text>
      <Text style={[styles.value, !props.assigned ? styles.valueMuted : null]}>{value}</Text>
      <Text style={styles.period}>{t('client.mood.adherence.period')}</Text>
    </View>
  );
}

export function MoodAdherenceCards(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <AdherenceCard
        assigned={props.trainingAssigned}
        label={t('client.mood.adherence.training')}
        percent={props.trainingPercent}
      />
      <AdherenceCard
        assigned={props.nutritionAssigned}
        label={t('client.mood.adherence.nutrition')}
        percent={props.nutritionPercent}
      />
    </View>
  );
}

function formatPercent(percent: null | number): string {
  return percent === null ? '–' : `${Math.round(percent)}%`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 12,
  },
  label: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '700' },
  period: { color: LIGHT.textMuted, fontSize: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16, paddingHorizontal: 16 },
  value: { color: LIGHT.textStrong, fontSize: 22, fontWeight: '800' },
  valueMuted: { color: LIGHT.textMuted, fontSize: 15 },
});
