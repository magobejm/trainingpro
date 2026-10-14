import { clientPlanDecorations } from '../theme/tokens';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  formatExerciseRepRange,
  isAdvancedRoutineSet,
  routineSetColumnsForType,
  type ClientRoutineExercise,
  type ClientRoutineSet,
} from '@trainerpro/shared';
import { LIGHT } from './light';
type ClientExerciseCardProps = {
  exercise: ClientRoutineExercise;
  expanded: boolean;
  onToggle: () => void;
  media?: React.ReactNode;
  onTrainerNote?: () => void;
  onInstructions?: () => void;
  onVideo?: () => void;
  t: (key: string) => string;
};

/* eslint-disable max-lines-per-function -- preview card includes media, notes, and per-set table. */
export function ClientExerciseCard({
  exercise,
  expanded,
  onToggle,
  media,
  onTrainerNote,
  onInstructions,
  onVideo,
  t,
}: ClientExerciseCardProps): React.JSX.Element {
  const typeBadge = resolveTypeBadge(exercise.type);
  const repRange = formatExerciseRepRange(exercise);
  const hasGenericInstructions = Boolean(exercise.coachInstructions?.trim());
  const hasTrainerNote = Boolean(exercise.notes?.trim());
  const hasVideo = Boolean(exercise.youtubeUrl?.trim());
  const columns = routineSetColumnsForType(exercise.type, exercise.lockedFields);

  return (
    <>
      <View style={[styles.exerciseCard, styles.card]}>
        <View style={styles.exerciseHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.exerciseName}>{exercise.displayName}</Text>
            {!expanded && exercise.setsPlanned ? (
              <Text style={styles.setsHint}>{`${exercise.setsPlanned} ${t('client.today.sets').toLowerCase()}`}</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            {hasTrainerNote ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('client.notes.trainerNote')}
                onPress={(event) => {
                  event.stopPropagation();
                  onTrainerNote?.();
                }}
                style={styles.iconBtn}
              >
                <Text>{'📄'}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={exercise.displayName}
              accessibilityState={{ expanded }}
              onPress={onToggle}
              style={styles.iconBtn}
            >
              <Text style={styles.exerciseChevron}>{expanded ? '▴' : '▾'}</Text>
            </Pressable>
          </View>
        </View>
        {expanded ? (
          <View style={styles.exerciseBody}>
            <Pressable
              disabled={!hasVideo}
              onPress={(event) => {
                event.stopPropagation();
                if (hasVideo) onVideo?.();
              }}
              style={styles.mediaBox}
            >
              {media}
              {hasVideo ? (
                <View style={styles.playOverlay}>
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>{'▶'}</Text>
                  </View>
                </View>
              ) : null}
            </Pressable>
            <View style={styles.metaRow}>
              {hasGenericInstructions ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    onInstructions?.();
                  }}
                >
                  <Text style={styles.metaLink}>{t('mobile.client.exercise.indications')}</Text>
                </Pressable>
              ) : (
                <View />
              )}
              {repRange ? (
                <Text style={styles.metaRange}>{`${t('mobile.client.exercise.repRange')} ${repRange}`}</Text>
              ) : null}
            </View>
            {exercise.sets.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, styles.seriesCol]}>{t('client.today.set')}</Text>
                    {columns.map((column) => (
                      <Text key={column.key} style={styles.tableHeaderCell}>
                        {t(column.labelKey).toUpperCase()}
                      </Text>
                    ))}
                  </View>
                  {exercise.sets.map((set) => (
                    <RoutineSetRow columns={columns} key={set.setIndex} set={set} t={t} />
                  ))}
                </View>
              </ScrollView>
            ) : null}
            <View
              style={[styles.exerciseTypeBadge, { alignSelf: 'flex-start', backgroundColor: typeBadge.bg, marginTop: 8 }]}
            >
              <Text style={[styles.exerciseTypeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </>
  );
}

function RoutineSetRow(props: {
  columns: ReturnType<typeof routineSetColumnsForType>;
  set: ClientRoutineSet;
  t: (key: string) => string;
}): React.JSX.Element {
  const { set, columns, t } = props;
  const advanced = isAdvancedRoutineSet(set);
  const setLabel = `${t('client.today.set')} ${set.setIndex + 1}`;

  return (
    <View style={styles.tableRow}>
      <View style={styles.seriesCol}>
        {advanced ? (
          <View>
            <Text style={styles.seriesNumber}>{setLabel}</Text>
            <Text numberOfLines={1} style={styles.advancedLabel}>
              {advancedTechniqueDisplayLabel(set.advancedTechnique!.trim(), t)}
            </Text>
          </View>
        ) : (
          <Text style={styles.seriesNumber}>{setLabel}</Text>
        )}
        {set.note ? <Text style={styles.advancedLabel}>{set.note}</Text> : null}
      </View>
      {columns.map((column) => (
        <Text key={column.key} style={styles.tableCell}>
          {column.format(set)}
        </Text>
      ))}
    </View>
  );
}

function resolveTypeBadge(type: string): { bg: string; label: string; text: string } {
  const map: Record<string, { bg: string; label: string; text: string }> = {
    cardio: { bg: LIGHT.accentSoft, label: 'Cardio', text: LIGHT.accentDark },
    isometric: { bg: clientPlanDecorations.isometricBackground, label: 'Isométrico', text: LIGHT.orange },
    mobility: { bg: LIGHT.emeraldSoft, label: 'Movilidad', text: LIGHT.success },
    plio: { bg: clientPlanDecorations.plioBackground, label: 'Pliométrico', text: clientPlanDecorations.plioText },
    sport: { bg: clientPlanDecorations.sportBackground, label: 'Deporte', text: LIGHT.purple },
    strength: { bg: LIGHT.accentSoft, label: 'Fuerza', text: LIGHT.accentDark },
  };
  return map[type] ?? { bg: LIGHT.accentSoft, label: 'Fuerza', text: LIGHT.accentDark };
}

const styles = StyleSheet.create({
  exerciseBody: { gap: 10, paddingTop: 10 },
  exerciseCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    padding: 16,
  },
  exerciseChevron: { color: LIGHT.accent, fontSize: 14 },
  exerciseHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  exerciseName: { color: LIGHT.textStrong, flex: 1, fontSize: 16, fontWeight: '700' },
  exerciseTypeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  exerciseTypeText: { fontSize: 10, fontWeight: '800' },
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
  mediaBox: {
    borderRadius: LIGHT.radiusLg,
    height: 160,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: clientPlanDecorations.imageOverlay,
    justifyContent: 'center',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: clientPlanDecorations.imageLabel,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  playIcon: {
    color: LIGHT.textOnNavy,
    fontSize: 22,
    marginLeft: 3,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaLink: {
    color: LIGHT.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaRange: {
    color: LIGHT.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tableScroll: {
    marginTop: 8,
  },
  table: {
    gap: 8,
    minWidth: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tableHeaderCell: {
    color: LIGHT.accentMuted,
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    minWidth: 52,
    textTransform: 'uppercase',
  },
  tableRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  seriesCol: {
    minWidth: 72,
    width: 72,
  },
  seriesNumber: {
    color: LIGHT.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  advancedLabel: {
    color: LIGHT.indigo,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tableCell: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 52,
  },
});

type AdvancedTechniqueId = 'topSet' | 'backOffSet' | 'clusterSets' | 'myoReps' | 'dropSet';
const ADVANCED_TECHNIQUE_IDS = ['topSet', 'backOffSet', 'clusterSets', 'myoReps', 'dropSet'];
const LEGACY_LABEL_TO_ID: Record<string, AdvancedTechniqueId> = {
  'Top Set': 'topSet',
  'Back-Off Set': 'backOffSet',
  'Cluster Sets': 'clusterSets',
  'Myo-Reps': 'myoReps',
  'Drop Set': 'dropSet',
};

export function advancedTechniqueDisplayLabel(stored: string, t: (k: string) => string): string {
  const id = (ADVANCED_TECHNIQUE_IDS as readonly string[]).includes(stored) ? stored : LEGACY_LABEL_TO_ID[stored];
  if (!id) return stored;
  const key = `coach.routine.advancedTechnique.${id}`;
  const tr = t(key);
  return tr === key ? stored : tr;
}
