import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  CardioSessionItem,
  IsometricSessionItem,
  MobilitySessionItem,
  PlioSessionItem,
  SessionItem,
  SportSessionItem,
  StrengthSessionItem,
} from '../../data/hooks/useTodaySession';
import { LIGHT } from '../../theme/light';

type ExerciseListCardProps = {
  item: SessionItem;
  onPress: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  cardio: 'Cardio',
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

function PlioCard({ item, onPress }: { item: PlioSessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  const loggedRounds = item.logs.length;
  const totalRounds = item.roundsPlanned;
  const isComplete = totalRounds > 0 && loggedRounds >= totalRounds;
  return (
    <Pressable style={[styles.card, isComplete && styles.cardComplete]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{t('client.today.setsProgress', { done: loggedRounds, total: totalRounds })}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeBlock]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL.plio}</Text>
        </View>
        {isComplete && <View style={styles.completeDot} />}
      </View>
    </Pressable>
  );
}

function MobilityCard({ item, onPress }: { item: MobilitySessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  const loggedSets = item.logs.length;
  const totalSets = item.roundsPlanned;
  const isComplete = totalSets > 0 && loggedSets >= totalSets;
  return (
    <Pressable style={[styles.card, isComplete && styles.cardComplete]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{t('client.today.setsProgress', { done: loggedSets, total: totalSets })}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeBlock]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL.mobility}</Text>
        </View>
        {isComplete && <View style={styles.completeDot} />}
      </View>
    </Pressable>
  );
}

function IsometricCard({ item, onPress }: { item: IsometricSessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  const loggedSets = item.logs.length;
  const totalSets = item.setsPlanned ?? 0;
  const isComplete = totalSets > 0 && loggedSets >= totalSets;
  return (
    <Pressable style={[styles.card, isComplete && styles.cardComplete]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{t('client.today.setsProgress', { done: loggedSets, total: totalSets })}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeBlock]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL.isometric}</Text>
        </View>
        {isComplete && <View style={styles.completeDot} />}
      </View>
    </Pressable>
  );
}

function SportCard({ item, onPress }: { item: SportSessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  const isDone = item.log != null;
  return (
    <Pressable style={[styles.card, isDone && styles.cardComplete]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{isDone ? t('client.today.blockDone') : t('client.today.blockPending')}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeBlock]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL.sport}</Text>
        </View>
        {isDone && <View style={styles.completeDot} />}
      </View>
    </Pressable>
  );
}

function CardioCard({ item, onPress }: { item: CardioSessionItem; onPress: () => void }) {
  const { t } = useTranslation();
  const loggedIntervals = item.intervalLogs.length;
  const totalRounds = item.roundsPlanned;
  const progressLabel = t('client.today.setsProgress', { done: loggedIntervals, total: totalRounds });
  const isComplete = totalRounds > 0 && loggedIntervals >= totalRounds;

  return (
    <Pressable style={[styles.card, isComplete && styles.cardComplete]} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.progressText}>{progressLabel}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.typeBadge, styles.typeBadgeBlock]}>
          <Text style={styles.typeLabel}>{TYPE_LABEL.cardio}</Text>
        </View>
        {isComplete && <View style={styles.completeDot} />}
      </View>
    </Pressable>
  );
}

export function ExerciseListCard({ item, onPress }: ExerciseListCardProps) {
  if (item.type === 'strength') return <StrengthCard item={item} onPress={onPress} />;
  if (item.type === 'cardio') return <CardioCard item={item} onPress={onPress} />;
  if (item.type === 'plio') return <PlioCard item={item} onPress={onPress} />;
  if (item.type === 'mobility') return <MobilityCard item={item} onPress={onPress} />;
  if (item.type === 'isometric') return <IsometricCard item={item} onPress={onPress} />;
  if (item.type === 'sport') return <SportCard item={item} onPress={onPress} />;
  return null;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 16,
  },
  cardComplete: {
    borderColor: LIGHT.emerald,
    borderWidth: 1.5,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  exerciseName: {
    color: LIGHT.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  progressText: {
    color: LIGHT.textMuted,
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
    backgroundColor: LIGHT.accentSoft,
  },
  typeBadgeBlock: {
    backgroundColor: LIGHT.emeraldSoft,
  },
  typeLabel: {
    color: LIGHT.accentDark,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeDot: {
    backgroundColor: LIGHT.emerald,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
