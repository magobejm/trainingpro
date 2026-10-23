import { useNutritionAdherenceQuery } from '../../../data/hooks/useNutrition';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './nutrition.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ClientNutritionAdherence({ clientId, t }: { clientId: string; t: Translate }): React.JSX.Element {
  const week = range(7);
  const month = range(30);
  const weekQuery = useNutritionAdherenceQuery(clientId, week.from, week.to);
  const monthQuery = useNutritionAdherenceQuery(clientId, month.from, month.to);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('coach.nutrition.client.adherenceTitle')}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.client.adherence7', summary(weekQuery.data?.summary))}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.client.adherence30', summary(monthQuery.data?.summary))}</Text>
      {(weekQuery.data?.days ?? []).map((day) => (
        <Text key={day.date} style={styles.headerSubtitle}>
          {t('coach.nutrition.client.adherenceDay', { date: day.date, done: day.done, expected: day.expected })}
        </Text>
      ))}
    </View>
  );
}

function range(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: key(from), to: key(to) };
}

function key(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function summary(data: { done: number; expected: number; percent: number | null } | undefined) {
  return { done: data?.done ?? 0, expected: data?.expected ?? 0, percent: data?.percent ?? 0 };
}
