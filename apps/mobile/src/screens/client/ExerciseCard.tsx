import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineExercise, ClientRoutineSet } from '../../data/hooks/useClientRoutineQuery';
import { YouTubeVideoModal } from '../../components/YouTubeVideoModal';
import { BlurredImageFrame } from '../../components/BlurredImageFrame';
import { getFullMediaUrl } from '../../utils/library-media.helpers';
import { advancedTechniqueDisplayLabel } from './advanced-technique.utils';
import { ExerciseInstructionsModal } from './ExerciseInstructionsModal';
import { RoutineSetDetailModal } from './RoutineSetDetailModal';
import { formatExerciseRepRange, isAdvancedRoutineSet, routineSetColumnsForType } from './routine-exercise-set.utils';
import { LIGHT } from '../../theme/light';
import { s } from '../../shell/client/client-shell.styles';

type ExerciseCardProps = {
  exercise: ClientRoutineExercise;
  expanded: boolean;
  onToggle: () => void;
};

/* eslint-disable max-lines-per-function -- preview card includes media, notes, and per-set table. */
export function ExerciseCard({ exercise, expanded, onToggle }: ExerciseCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const [genericInstructionsOpen, setGenericInstructionsOpen] = useState(false);
  const [trainerNoteOpen, setTrainerNoteOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<ClientRoutineSet | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const typeBadge = resolveTypeBadge(exercise.type);
  const repRange = formatExerciseRepRange(exercise);
  const hasGenericInstructions = Boolean(exercise.coachInstructions?.trim());
  const hasTrainerNote = Boolean(exercise.notes?.trim());
  const hasVideo = Boolean(exercise.youtubeUrl?.trim());
  const imageUri = getFullMediaUrl(exercise.type, exercise.mediaUrl);
  const columns = routineSetColumnsForType(exercise.type, exercise.lockedFields);

  return (
    <>
      <View style={[s.exerciseCard, styles.card]}>
        <View style={s.exerciseHeader}>
          <View style={styles.headerLeft}>
            <Text style={s.exerciseName}>{exercise.displayName}</Text>
            {!expanded && exercise.setsPlanned ? (
              <Text style={styles.setsHint}>{`${exercise.setsPlanned} ${t('client.today.sets').toLowerCase()}`}</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            {hasTrainerNote ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setTrainerNoteOpen(true);
                }}
                style={styles.iconBtn}
              >
                <Text>{'📄'}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onToggle} style={styles.iconBtn}>
              <Text style={s.exerciseChevron}>{expanded ? '▴' : '▾'}</Text>
            </Pressable>
          </View>
        </View>
        {expanded ? (
          <View style={s.exerciseBody}>
            <Pressable
              disabled={!hasVideo}
              onPress={(event) => {
                event.stopPropagation();
                if (hasVideo) setVideoOpen(true);
              }}
              style={styles.mediaBox}
            >
              <BlurredImageFrame imageUri={imageUri} />
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
                    setGenericInstructionsOpen(true);
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
                    <RoutineSetRow
                      key={set.setIndex}
                      columns={columns}
                      set={set}
                      t={t}
                      onPress={(entry) => {
                        if (isAdvancedRoutineSet(entry)) setSelectedSet(entry);
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : null}
            <View style={[s.exerciseTypeBadge, { alignSelf: 'flex-start', backgroundColor: typeBadge.bg, marginTop: 8 }]}>
              <Text style={[s.exerciseTypeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
            </View>
          </View>
        ) : null}
      </View>
      <ExerciseInstructionsModal
        emptyKey={'mobile.client.exercise.instructionsEmpty'}
        instructions={exercise.coachInstructions}
        title={t('client.notes.exerciseInstructions')}
        visible={genericInstructionsOpen}
        onClose={() => setGenericInstructionsOpen(false)}
      />
      <ExerciseInstructionsModal
        emptyKey={'mobile.client.exercise.trainerNoteEmpty'}
        instructions={exercise.notes}
        title={t('client.notes.trainerNote')}
        visible={trainerNoteOpen}
        onClose={() => setTrainerNoteOpen(false)}
      />
      <RoutineSetDetailModal set={selectedSet} visible={selectedSet != null} onClose={() => setSelectedSet(null)} />
      <YouTubeVideoModal
        title={exercise.displayName}
        visible={videoOpen}
        youtubeUrl={exercise.youtubeUrl}
        onClose={() => setVideoOpen(false)}
      />
    </>
  );
}

function RoutineSetRow(props: {
  columns: ReturnType<typeof routineSetColumnsForType>;
  set: ClientRoutineSet;
  t: (key: string) => string;
  onPress: (set: ClientRoutineSet) => void;
}): React.JSX.Element {
  const { set, columns, t, onPress } = props;
  const advanced = isAdvancedRoutineSet(set);
  const setLabel = `${t('client.today.set')} ${set.setIndex + 1}`;

  return (
    <View style={styles.tableRow}>
      <View style={styles.seriesCol}>
        {advanced ? (
          <Pressable onPress={() => onPress(set)}>
            <Text style={styles.seriesLink}>{setLabel}</Text>
            <Text numberOfLines={1} style={styles.advancedLabel}>
              {advancedTechniqueDisplayLabel(set.advancedTechnique!.trim(), t)}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.seriesNumber}>{setLabel}</Text>
        )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  playIcon: {
    color: '#fff',
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
  seriesLink: {
    color: LIGHT.accentDark,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
