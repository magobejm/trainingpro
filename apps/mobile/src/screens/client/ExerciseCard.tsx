import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineExercise } from '../../data/hooks/useClientRoutineQuery';
import { RoutineExerciseNotes } from './RoutineExerciseNotes';
import { LIGHT } from '../../theme/light';
import { s } from '../../shell/client/client-shell.styles';

type ExerciseCardProps = {
  exercise: ClientRoutineExercise;
  expanded: boolean;
  onToggle: () => void;
};

export function ExerciseCard({ exercise, expanded, onToggle }: ExerciseCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const typeBadge = resolveTypeBadge(exercise.type);
  const repsValue =
    exercise.repsMin && exercise.repsMax
      ? `${exercise.repsMin}-${exercise.repsMax}`
      : (exercise.repsMin ?? exercise.repsMax);
  const hasNotes = Boolean(
    exercise.coachInstructions?.trim() ||
    exercise.notes?.trim() ||
    exercise.sets.some((set) => set.note || set.advancedTechnique),
  );

  return (
    <Pressable onPress={onToggle} style={[s.exerciseCard, styles.card]}>
      <View style={s.exerciseHeader}>
        <View style={styles.headerLeft}>
          <Text style={s.exerciseName}>{exercise.displayName}</Text>
          {!expanded && exercise.setsPlanned ? (
            <Text style={styles.setsHint}>{`${exercise.setsPlanned} ${t('client.today.sets').toLowerCase()}`}</Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          {hasNotes ? (
            <View style={styles.iconBtn}>
              <Text>{'📄'}</Text>
            </View>
          ) : null}
          <Pressable onPress={onToggle} style={styles.iconBtn}>
            <Text style={s.exerciseChevron}>{expanded ? '▴' : '▾'}</Text>
          </Pressable>
        </View>
      </View>
      {expanded ? (
        <View style={s.exerciseBody}>
          <View style={styles.detailsRow}>
            <Text style={s.sectionLabel}>{t('mobile.client.exercise.details')}</Text>
            {repsValue ? <Text style={styles.repsValue}>{String(repsValue)}</Text> : null}
          </View>
          <View style={s.exerciseMetaRow}>
            <ExMeta label={t('client.today.sets')} value={exercise.setsPlanned} />
            <ExMeta label={t('client.label.reps')} value={repsValue} />
            <ExMeta label={t('client.label.rpe')} value={exercise.targetRpe} />
            <ExMeta label={t('client.label.rir')} value={exercise.targetRir} />
            <ExMeta label={t('client.today.restTimer')} value={exercise.restSeconds ? `${exercise.restSeconds}s` : null} />
          </View>
          <RoutineExerciseNotes exercise={exercise} />
          <View style={[s.exerciseTypeBadge, { alignSelf: 'flex-start', backgroundColor: typeBadge.bg, marginTop: 8 }]}>
            <Text style={[s.exerciseTypeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

function ExMeta(props: { label: string; value: string | number | null | undefined }): React.JSX.Element | null {
  if (props.value === null || props.value === undefined) return null;
  return (
    <View style={s.exMetaItem}>
      <Text style={s.exMetaLabel}>{props.label}</Text>
      <Text style={s.exMetaValue}>{String(props.value)}</Text>
    </View>
  );
}

function resolveTypeBadge(type: string): { bg: string; label: string; text: string } {
  const map: Record<string, { bg: string; label: string; text: string }> = {
    cardio: { bg: LIGHT.accentSoft, label: 'Cardio', text: LIGHT.accentDark },
    isometric: { bg: '#ffedd5', label: 'Isométrico', text: LIGHT.orange },
    mobility: { bg: LIGHT.emeraldSoft, label: 'Movilidad', text: LIGHT.success },
    plio: { bg: '#fef9c3', label: 'Pliométrico', text: '#ca8a04' },
    sport: { bg: '#f3e8ff', label: 'Deporte', text: LIGHT.purple },
    strength: { bg: LIGHT.accentSoft, label: 'Fuerza', text: LIGHT.accentDark },
  };
  return map[type] ?? { bg: LIGHT.accentSoft, label: 'Fuerza', text: LIGHT.accentDark };
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  setsHint: {
    color: LIGHT.accent,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  repsValue: {
    color: LIGHT.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
});
