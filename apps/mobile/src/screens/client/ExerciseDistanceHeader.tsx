import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SessionItem } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';

function sumDistance(values: Array<number | null | undefined>): number | null {
  const actual = values.filter((value): value is number => value != null && Number.isFinite(value));
  return actual.length ? actual.reduce((sum, value) => sum + value, 0) : null;
}

export function exerciseDistanceMeters(item: SessionItem): number | null {
  if (item.type === 'cardio') {
    const series = sumDistance(item.intervalLogs.map((row) => row.distanceDoneMeters));
    return series ?? item.distanceDoneMeters ?? null;
  }
  if (item.type === 'sport') return sumDistance(item.setLogs.map((row) => row.distanceDoneMeters));
  return null;
}

export function ExerciseDistanceHeader(props: { item: SessionItem }): React.JSX.Element | null {
  const { t } = useTranslation();
  if (props.item.type !== 'sport') return null;
  const metres = exerciseDistanceMeters(props.item);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('mobile.client.history.distanceKm')}</Text>
      <Text style={styles.label}>{metres == null ? '—' : `${metres / 1000} km`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  label: { color: LIGHT.textStrong, fontWeight: '700' },
});
