import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineDay, ClientRoutineExercise } from '../../data/hooks/useClientRoutineQuery';
import type { SessionItem, SessionView } from '../../data/hooks/useTodaySession';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { s } from '../../shell/client/client-shell.styles';
import { LIGHT } from '../../theme/light';
import { PrimaryButton } from '../../theme/primitives';
import { ExerciseCard } from './ExerciseCard';
import { buildExerciseBlocks } from './exercise-group.utils';
import { isSessionItemComplete } from './session-completion.utils';

type PreviewProps = {
  day: ClientRoutineDay;
  mode: 'preview';
  onClose: () => void;
  onStart: () => void;
  startDisabled?: boolean;
  startLabel?: string;
  startPending?: boolean;
  startError?: boolean;
};

type ActiveProps = {
  dayTitle: string;
  exercises: SessionItem[];
  mode: 'active';
  onClose: () => void;
  onFinishDay: () => void;
  onSelectExercise: (item: SessionItem, group: SessionItem[]) => void;
  session: SessionView;
  workoutElapsed?: string;
};

export type RoutineDayScreenProps = ActiveProps | PreviewProps;

export function RoutineDayScreen(props: RoutineDayScreenProps): React.JSX.Element {
  if (props.mode === 'preview') {
    return <PreviewDay {...props} />;
  }
  return <ActiveDay {...props} />;
}

function PreviewDay(props: PreviewProps): React.JSX.Element {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const blocks = useMemo(() => buildExerciseBlocks(props.day.exercises), [props.day.exercises]);

  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={[s.panelContent, styles.scrollBottom]}>
        <DayHeader count={props.day.exercises.length} title={props.day.title} />
        {blocks.map((block) => (
          <ExerciseBlockContainer block={block} key={block.exercises.map((e) => e.id).join('-')}>
            {block.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                expanded={expandedId === exercise.id}
                onToggle={() => setExpandedId(expandedId === exercise.id ? null : exercise.id)}
              />
            ))}
          </ExerciseBlockContainer>
        ))}
        <PrimaryButton
          disabled={props.startDisabled || props.startPending}
          label={props.startPending ? t('mobile.shell.loading') : (props.startLabel ?? t('mobile.client.day.startTraining'))}
          onPress={props.onStart}
          variant={'success'}
        />
        {props.startError ? <Text style={s.startTrainingError}>{t('mobile.client.day.startError')}</Text> : null}
        {props.day.notes ? (
          <View style={s.dayNotesCard}>
            <Text style={s.sectionLabel}>{t('mobile.client.day.notes')}</Text>
            <Text style={s.notesText}>{props.day.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ActiveDay(props: ActiveProps): React.JSX.Element {
  const { t } = useTranslation();
  const blocks = useMemo(() => buildExerciseBlocks(props.exercises), [props.exercises]);
  const isFinished = props.session.status === 'COMPLETED';

  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={[s.panelContent, styles.scrollBottom]}>
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>{props.dayTitle}</Text>
          <View style={styles.headerRight}>
            {props.workoutElapsed ? (
              <View style={styles.timerBadge}>
                <View style={styles.timerDot} />
                <Text style={styles.timerText}>{props.workoutElapsed}</Text>
              </View>
            ) : null}
            <View style={s.dayExPill}>
              <Text style={s.dayExPillText}>{t('client.planning.exercisesCount', { count: props.exercises.length })}</Text>
            </View>
          </View>
        </View>
        {blocks.map((block) => (
          <ExerciseBlockContainer block={block} key={block.exercises.map((e) => e.id).join('-')}>
            {block.exercises.map((exercise) => {
              const complete = isSessionItemComplete(exercise);
              const group = block.exercises;
              return (
                <Pressable
                  key={exercise.id}
                  onPress={() => props.onSelectExercise(exercise, group)}
                  style={[styles.activeRow, complete && styles.activeRowDone]}
                >
                  <Text style={styles.activeRowName}>{exercise.displayName}</Text>
                  {complete ? (
                    <View style={styles.donePill}>
                      <Text style={styles.donePillText}>{t('mobile.client.session.done')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.chevron}>{'›'}</Text>
                  )}
                </Pressable>
              );
            })}
          </ExerciseBlockContainer>
        ))}
        {!isFinished ? (
          <PrimaryButton label={t('mobile.client.session.finishDay')} onPress={props.onFinishDay} variant={'danger'} />
        ) : (
          <PrimaryButton
            disabled
            label={t('mobile.client.session.workoutFinished')}
            onPress={() => {}}
            variant={'success'}
          />
        )}
      </ScrollView>
    </View>
  );
}

function DayHeader(props: { count: number; title: string }): React.JSX.Element {
  return (
    <View style={styles.dayHeader}>
      <Text style={styles.dayTitle}>{props.title}</Text>
      <View style={s.dayExPill}>
        <Text style={s.dayExPillText}>{`${props.count} ejer`}</Text>
      </View>
    </View>
  );
}

function ExerciseBlockContainer(props: {
  block: ReturnType<typeof buildExerciseBlocks<ClientRoutineExercise | SessionItem>>[number];
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  if (props.block.type === 'single') {
    return <View style={styles.singleBlock}>{props.children}</View>;
  }
  const label = props.block.type === 'superset' ? t('mobile.client.session.superset') : t('mobile.client.session.circuit');
  return (
    <View style={styles.groupBlock}>
      <View style={styles.groupBadge}>
        <Text style={styles.groupBadgeText}>{label}</Text>
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollBottom: {
    paddingBottom: 80,
  },
  dayHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayTitle: {
    color: LIGHT.textStrong,
    fontSize: 28,
    fontWeight: '800',
  },
  activeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeTitle: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  timerBadge: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusFull,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timerDot: {
    backgroundColor: LIGHT.emerald,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  timerText: {
    color: LIGHT.success,
    fontSize: 13,
    fontWeight: '700',
  },
  singleBlock: {
    marginBottom: 12,
  },
  groupBlock: {
    backgroundColor: 'rgba(30, 58, 138, 0.05)',
    borderColor: 'rgba(30, 58, 138, 0.2)',
    borderRadius: LIGHT.radius2xl,
    borderWidth: 2,
    marginBottom: 16,
    padding: 12,
    paddingTop: 20,
    position: 'relative',
  },
  groupBadge: {
    backgroundColor: LIGHT.bgNavy,
    borderRadius: LIGHT.radiusFull,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: -12,
  },
  groupBadgeText: {
    color: LIGHT.textOnNavy,
    fontSize: 11,
    fontWeight: '700',
  },
  activeRow: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 16,
  },
  activeRowDone: {
    borderColor: LIGHT.emerald,
  },
  activeRowName: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  donePill: {
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  donePillText: {
    color: LIGHT.success,
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    color: LIGHT.accent,
    fontSize: 22,
    fontWeight: '700',
  },
});
