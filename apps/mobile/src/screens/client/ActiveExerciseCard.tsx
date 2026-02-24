import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { SessionView } from '../../data/hooks/useTodaySession';
import { SessionSetRow, type SessionSetRowProps } from './SessionSetRow';

export type ActiveExerciseCardProps = {
  item: SessionView['items'][0];
  onLogSet: SessionSetRowProps['onLogSet'];
};

export function ActiveExerciseCard({ item, onLogSet }: ActiveExerciseCardProps) {
  const { t } = useTranslation();
  const setsCount = item.setsPlanned ?? 1;
  const setsArray = Array.from({ length: setsCount }).map((_, i) => i + 1);

  return (
    <View style={styles.card}>
      <Text style={styles.itemTitle}>{item.displayName}</Text>
      <View style={styles.setsContainer}>
        <View style={styles.setHeaderRow}>
          <Text style={styles.setColHeader}>{t('client.today.set', 'Set')}</Text>
          <Text style={styles.setColHeader}>{t('client.today.prev', 'Prev')}</Text>
          <Text style={styles.setColHeader}>{t('client.today.kg', 'Kg')}</Text>
          <Text style={styles.setColHeader}>{t('client.today.reps', 'Reps')}</Text>
          <View style={styles.checkCol} />
        </View>
        {setsArray.map((setNumber) => (
          <SessionSetRow item={item} key={setNumber} onLogSet={onLogSet} setIndex={setNumber} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 14,
    padding: 16,
    width: '100%',
  },
  checkCol: {
    flex: 1,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  setColHeader: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  setHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  setsContainer: {
    gap: 10,
    width: '100%',
  },
});
