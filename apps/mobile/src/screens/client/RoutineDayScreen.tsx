import React, { useMemo } from 'react';
import { ClientRoutineDayContent } from '@trainerpro/ui';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineDay, ClientRoutineExercise } from '../../data/hooks/useClientRoutineQuery';
import type { SessionItem, SessionView } from '../../data/hooks/useTodaySession';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { s } from '../../shell/client/client-shell.styles';
import { LIGHT } from '../../theme/light';
import { PrimaryButton } from '../../theme/primitives';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseOrderBadge } from './ExerciseOrderBadge';
import { buildExerciseBlocks } from './exercise-group.utils';
import { isListedExerciseDone } from './session-completion.utils';
import { MiniRestTimer } from './MiniRestTimer';
import { WorkoutWarmups, RoutineBlock, warmupExerciseCount } from './WorkoutWarmups';
import type { ClientRoutineWarmup } from '@trainerpro/shared';
import type { RestState } from './session-rest.types';

type PreviewProps = {
  day: ClientRoutineDay;
  mode: 'preview';
  notice?: string | null;
  onClose: () => void;
  onStart: () => void;
  onUndoSkip?: () => void;
  startDisabled?: boolean;
  startLabel?: string;
  startPending?: boolean;
  startError?: boolean;
  undoLabel?: string;
};

type ActiveProps = {
  warmups?: ClientRoutineWarmup[];
  dayTitle: string;
  exercises: SessionItem[];
  finishedExerciseIds?: ReadonlySet<string>;
  mode: 'active';
  onClose: () => void;
  onFinishDay: () => void;
  onSelectExercise: (item: SessionItem, group: SessionItem[]) => void;
  session: SessionView;
  workoutElapsed?: string;
  onOpenRest?: () => void;
  onRestFinish?: () => void;
  rest?: RestState | null;
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

  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={[s.panelContent, styles.scrollBottom]}>
        {warmupExerciseCount(props.day.warmups) ? (
          <View style={styles.activeHeader}>
            <Text style={styles.activeTitle}>{props.day.title}</Text>
            <Text style={s.dayExPillText}>
              {t('mobile.client.warmup.summary', {
                routine: props.day.exercises.length,
                warmup: warmupExerciseCount(props.day.warmups),
              })}
            </Text>
          </View>
        ) : null}
        <WorkoutWarmups warmups={props.day.warmups} />
        <RoutineBlock warmups={props.day.warmups} count={props.day.exercises.length}>
          <ClientRoutineDayContent
            day={props.day}
            showHeader={!warmupExerciseCount(props.day.warmups)}
            t={t}
            renderExercise={(exercise, expanded, onToggle) => (
              <ExerciseCard exercise={exercise} expanded={expanded} onToggle={onToggle} />
            )}
          />
        </RoutineBlock>
        {props.notice ? <Text style={styles.notice}>{props.notice}</Text> : null}
        {props.onUndoSkip ? <PrimaryButton label={props.undoLabel ?? ''} onPress={props.onUndoSkip} /> : null}
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
  const resting = props.rest != null && props.onOpenRest != null && props.onRestFinish != null;

  return (
    <View style={[s.sidePanel, styles.activeDay]}>
      <OverlayBackHeader onClose={props.onClose} />
      <ScrollView contentContainerStyle={[s.panelContent, resting ? styles.scrollBottomWithRest : styles.scrollBottom]}>
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
              <Text style={s.dayExPillText}>
                {warmupExerciseCount(props.warmups)
                  ? t('mobile.client.warmup.summary', {
                      routine: props.exercises.length,
                      warmup: warmupExerciseCount(props.warmups),
                    })
                  : t('client.planning.exercisesCount', { count: props.exercises.length })}
              </Text>
            </View>
          </View>
        </View>
        <WorkoutWarmups warmups={props.warmups} active />
        <RoutineBlock warmups={props.warmups} count={props.exercises.length} active>
          {blocks.map((block) => (
            <ExerciseBlockContainer block={block} key={block.exercises.map((e) => e.id).join('-')}>
              {block.exercises.map((exercise) => (
                <ActiveExerciseRow
                  complete={isListedExerciseDone(exercise, props.finishedExerciseIds)}
                  exercise={exercise}
                  finished={isFinished}
                  key={exercise.id}
                  onSelect={() => props.onSelectExercise(exercise, block.exercises)}
                  total={props.exercises.length}
                />
              ))}
            </ExerciseBlockContainer>
          ))}
        </RoutineBlock>
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
      {resting && props.rest && props.onOpenRest && props.onRestFinish ? (
        <View style={styles.miniRest}>
          <MiniRestTimer endAt={props.rest.endAt} onFinish={props.onRestFinish} onPress={props.onOpenRest} />
        </View>
      ) : null}
    </View>
  );
}

function ActiveExerciseRow(props: {
  complete: boolean;
  exercise: SessionItem;
  finished: boolean;
  onSelect: () => void;
  total: number;
}): React.JSX.Element {
  const { t } = useTranslation();
  const order = props.exercise.completionOrder;
  return (
    <View style={[styles.activeRow, props.complete && styles.activeRowDone]}>
      <Pressable onPress={props.onSelect} style={styles.activeRowLeft}>
        <Text style={styles.activeRowName}>{props.exercise.displayName}</Text>
        {props.complete ? (
          <View style={styles.donePill}>
            <Text style={styles.donePillText}>{t('mobile.client.session.done')}</Text>
          </View>
        ) : null}
      </Pressable>
      {props.complete && typeof order === 'number' ? <ExerciseOrderBadge order={order} total={props.total} /> : null}
      <Pressable onPress={props.onSelect}>
        {props.complete || props.finished ? (
          <View style={styles.editBtn}>
            <Text style={styles.editBtnText}>
              {t(props.finished ? 'mobile.client.exercise.view' : 'mobile.client.exercise.edit')}
            </Text>
          </View>
        ) : (
          <Text style={styles.chevron}>{'›'}</Text>
        )}
      </Pressable>
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
  activeDay: {
    flex: 1,
    position: 'relative',
  },
  scrollBottom: {
    paddingBottom: 80,
  },
  scrollBottomWithRest: {
    paddingBottom: 160,
  },
  miniRest: {
    bottom: 12,
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  notice: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '700' },
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
  activeRowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 8,
  },
  activeRowName: {
    color: LIGHT.textStrong,
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
  editBtn: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editBtnText: {
    color: LIGHT.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    color: LIGHT.accent,
    fontSize: 22,
    fontWeight: '700',
  },
});
