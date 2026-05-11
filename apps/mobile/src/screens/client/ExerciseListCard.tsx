import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BlockSessionItem, SessionItem, StrengthSessionItem } from '../../data/hooks/useTodaySession';

type ExerciseListCardProps = {
  item: SessionItem;
  onPress: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  isometric: 'Isométrico',
  mobility: 'Movilidad',
  plio: 'Pliométrico',
  sport: 'Deporte',
  strength: 'Fuerza',
};

function StrengthCard({ item, onPress }: { item: StrengthSessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  const loggedSets = item.logs.length;
  const totalSets = item.setsPlanned ?? 0;
  const progressLabel = t('client.today.setsProgress', { done: loggedSets, total: totalSets });
  const isComplete = totalSets > 0 && loggedSets >= totalSets;

  return (
    <Pressable style={[styles.card, isComplete && styles.cardComplete]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{progressLabel}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeStrength]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL.strength}</Text>
        </View>
        {isComplete && <View style={styles.completeDot} />}
      </View>
    </Pressable>
  );
}

function BlockCard({ item, onPress }: { item: BlockSessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{t('client.today.blockInfo', { meta: item.meta })}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeBlock]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL[item.type] ?? item.type}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ExerciseListCard({ item, onPress }: ExerciseListCardProps) {
  if (item.type === 'strength') {
    return <StrengthCard item={item} onPress={onPress} />;
  }
  return <BlockCard item={item} onPress={onPress} />;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 16,
  },
  cardComplete: {
    borderColor: '#22c55e',
    borderWidth: 1.5,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  exerciseName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  progressText: {
    color: '#64748b',
    fontSize: 13,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeStrength: {
    backgroundColor: '#312e81',
  },
  typeBadgeBlock: {
    backgroundColor: '#14532d',
  },
  typeLabel: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeDot: {
    backgroundColor: '#22c55e',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
