/* eslint-disable max-lines, max-lines-per-function -- unified active exercise matrix with inline set editors and modals. */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type {
  LogIntervalMutationInput,
  LogIsometricSetMutationInput,
  LogMobilitySetMutationInput,
  LogPlioSetMutationInput,
  LogSetMutationInput,
  LogSportMutationInput,
  SessionItem,
} from '../../data/hooks/useTodaySession';
import { YouTubeVideoModal } from '../../components/YouTubeVideoModal';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import { showToast } from '../../shell/client/feedback';
import {
  buildClearPayload,
  buildLogPayload,
  elapsedRestSeconds,
  formatSessionRepRange,
  getRestSeconds,
  getSetColumns,
  getSetCount,
  getSourceExerciseId,
  getStrengthSessionItemId,
  readActualValue,
  readSessionYoutubeUrl,
  readTargetValue,
  resolveSetSave,
  restWasRecorded,
  setWasLogged,
  type SetColumn,
  type SetFieldKey,
} from './active-exercise.helpers';
import { CircularCountdown } from './CircularCountdown';
import { ExerciseCommentModal } from './ExerciseCommentModal';
import { ExerciseNotesPanel } from './ExerciseNotesPanel';
import { formatRestLabel } from './session-completion.utils';
import { PreviousDaysOverlay } from './PreviousDaysOverlay';
import { RestTimerOverlay } from './RestTimerOverlay';
import type { RestState } from './session-rest.types';
import { sanitizeRirInput, sanitizeRpeInput } from './effort-input.utils';
import { RomScaleModal } from './RomScaleModal';
import { isRomScaleValue } from './rom-scale.utils';

type ActiveExerciseScreenProps = {
  exerciseGroup: SessionItem[];
  item: SessionItem;
  sessionId: string;
  visible: boolean;
  workoutElapsed?: string;
  completedRestKeys: string[];
  onClose: () => void;
  onCollapseRest: () => void;
  onExpandRest: () => void;
  onFinishExercise: (itemId: string) => void;
  onNavigateExercise: (item: SessionItem) => void;
  onRestFinish: () => void;
  onLogInterval: (input: LogIntervalMutationInput) => Promise<void> | void;
  onLogIsometricSet: (input: LogIsometricSetMutationInput) => Promise<void> | void;
  onLogMobilitySet: (input: LogMobilitySetMutationInput) => Promise<void> | void;
  onLogPlioSet: (input: LogPlioSetMutationInput) => Promise<void> | void;
  onLogSet: (input: LogSetMutationInput) => Promise<void> | void;
  onLogSport: (input: LogSportMutationInput) => Promise<void> | void;
  onStartRest: (setKey: string, seconds: number) => void;
  restState: RestState | null;
};

type RomState = { setIndex: number } | null;

function emptyRow(): Record<SetFieldKey, string> {
  return {
    distance: '',
    duration: '',
    fcMaxPct: '',
    fcReservePct: '',
    heartRate: '',
    reps: '',
    rest: '',
    rir: '',
    rpe: '',
    rom: '',
    weight: '',
  };
}

export function ActiveExerciseScreen(props: ActiveExerciseScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [showComment, setShowComment] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [romState, setRomState] = useState<RomState>(null);
  const [draftValues, setDraftValues] = useState<Record<number, Record<SetFieldKey, string>>>({});
  const [finishing, setFinishing] = useState(false);
  const recordedRestRef = useRef<Record<number, number>>({});

  const groupIndex = props.exerciseGroup.findIndex((entry) => entry.id === props.item.id);
  const setCount = getSetCount(props.item);
  const columns = getSetColumns(props.item);

  useEffect(() => {
    const next: Record<number, Record<SetFieldKey, string>> = {};
    for (let setIndex = 1; setIndex <= setCount; setIndex += 1) {
      const row: Record<SetFieldKey, string> = {
        distance: readActualValue(props.item, setIndex, 'distance'),
        duration: readActualValue(props.item, setIndex, 'duration'),
        fcMaxPct: readActualValue(props.item, setIndex, 'fcMaxPct'),
        fcReservePct: readActualValue(props.item, setIndex, 'fcReservePct'),
        heartRate: readActualValue(props.item, setIndex, 'heartRate'),
        reps: readActualValue(props.item, setIndex, 'reps'),
        rest: readActualValue(props.item, setIndex, 'rest'),
        rir: readActualValue(props.item, setIndex, 'rir'),
        rpe: readActualValue(props.item, setIndex, 'rpe'),
        rom: readActualValue(props.item, setIndex, 'rom'),
        weight: readActualValue(props.item, setIndex, 'weight'),
      };
      next[setIndex] = row;
    }
    setDraftValues(next);
  }, [props.item, setCount]);

  useEffect(() => {
    setShowVideo(false);
  }, [props.item.id]);

  const saveSet = (setIndex: number, restOverride?: number): Promise<void> => {
    const values = draftValues[setIndex];
    if (!values) return Promise.resolve();
    const restSecondsDone = restOverride ?? recordedRestRef.current[setIndex];
    const payload = buildLogPayload(props.item, setIndex, values, restSecondsDone);
    const action = resolveSetSave(payload, setWasLogged(props.item, setIndex));
    if (action === 'skip') return Promise.resolve();
    const body = action === 'delete' ? buildClearPayload(props.item, setIndex) : payload;
    if (!body) return Promise.resolve();
    if ('sessionItemId' in body) return Promise.resolve(props.onLogSet(body));
    if ('sessionPlioBlockId' in body) return Promise.resolve(props.onLogPlioSet(body));
    if ('sessionMobilityBlockId' in body) return Promise.resolve(props.onLogMobilitySet(body));
    if ('sessionIsometricBlockId' in body) return Promise.resolve(props.onLogIsometricSet(body));
    if ('sessionCardioBlockId' in body) return Promise.resolve(props.onLogInterval(body));
    if ('sessionSportBlockId' in body) return Promise.resolve(props.onLogSport(body));
    return Promise.resolve();
  };

  const handleSaveSet = (setIndex: number) => {
    void saveSet(setIndex);
  };

  const handleRestComplete = () => {
    const rest = props.restState;
    if (rest) {
      const setIndex = Number(rest.setKey.split(':').at(-1));
      const elapsed = elapsedRestSeconds(rest.endAt, rest.seconds);
      if (Number.isInteger(setIndex) && setIndex > 0) {
        recordedRestRef.current = { ...recordedRestRef.current, [setIndex]: elapsed };
        if (setWasLogged(props.item, setIndex)) void saveSet(setIndex, elapsed);
      }
    }
    props.onRestFinish();
  };

  const handleFinishExercise = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const pending: Array<Promise<void>> = [];
      for (let setIndex = 1; setIndex <= setCount; setIndex += 1) {
        pending.push(saveSet(setIndex));
      }
      await Promise.all(pending);
      props.onFinishExercise(props.item.id);
    } catch {
      setFinishing(false);
    }
  };

  const handleRomSave = (value: string) => {
    if (!romState) return;
    setDraftValues((current) => ({
      ...current,
      [romState.setIndex]: {
        ...(current[romState.setIndex] ?? emptyRow()),
        rom: value,
      },
    }));
    setRomState(null);
  };

  const navigateGroup = (direction: -1 | 1) => {
    const next = props.exerciseGroup[groupIndex + direction];
    if (next) props.onNavigateExercise(next);
  };

  const repsRange = formatSessionRepRange(props.item);
  const youtubeUrl = readSessionYoutubeUrl(props.item);

  const handleOpenVideo = () => {
    if (!youtubeUrl) {
      showToast(t('mobile.client.exercise.videoEmpty'));
      return;
    }
    setShowVideo(true);
  };

  return (
    <Modal visible={props.visible} animationType={'slide'} onRequestClose={props.onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={SESSION.backBtn} onPress={props.onClose}>
            <Text style={SESSION.backArrow}>{'←'}</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            {props.exerciseGroup.length > 1 ? (
              <Pressable disabled={groupIndex <= 0} onPress={() => navigateGroup(-1)} style={styles.navBtn}>
                <Text style={[styles.navArrow, groupIndex <= 0 && styles.navDisabled]}>{'‹'}</Text>
              </Pressable>
            ) : null}
            <Text numberOfLines={2} style={styles.title}>
              {props.item.displayName}
            </Text>
            {props.exerciseGroup.length > 1 ? (
              <Pressable
                disabled={groupIndex >= props.exerciseGroup.length - 1}
                onPress={() => navigateGroup(1)}
                style={styles.navBtn}
              >
                <Text style={[styles.navArrow, groupIndex >= props.exerciseGroup.length - 1 && styles.navDisabled]}>
                  {'›'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {repsRange ? (
          <Text style={styles.repRange}>
            {t('mobile.client.session.repRange')} <Text style={styles.repRangeValue}>{repsRange}</Text>
          </Text>
        ) : null}

        <ExerciseActionBar
          onOpenComment={() => setShowComment(true)}
          onOpenNotes={() => setShowNotes(true)}
          onOpenVideo={handleOpenVideo}
        />

        <ScrollView contentContainerStyle={styles.scroll}>
          {Array.from({ length: setCount }, (_, index) => {
            const setIndex = index + 1;
            const setKey = `${props.item.id}:${setIndex}`;
            const restDone = props.completedRestKeys.includes(setKey) || restWasRecorded(props.item, setIndex);
            const restSeconds = getRestSeconds(props.item, setIndex);
            const isActiveRest = props.restState?.setKey === setKey;
            const restLocked = props.restState != null && props.restState.setKey !== setKey;
            return (
              <View key={setKey} style={styles.setCard}>
                <View style={styles.setHeader}>
                  <View style={styles.setHeaderLeft}>
                    <Text style={styles.setTitle}>{`${t('client.today.set')} ${setIndex}`}</Text>
                  </View>
                  {restSeconds > 0 ? (
                    <SetRestButton
                      active={isActiveRest}
                      completed={restDone}
                      disabled={restLocked}
                      endAt={isActiveRest ? props.restState!.endAt : null}
                      restSeconds={restSeconds}
                      onExpand={props.onExpandRest}
                      onFinish={handleRestComplete}
                      onStart={() => props.onStartRest(setKey, restSeconds)}
                    />
                  ) : null}
                </View>
                <View style={styles.grid}>
                  {columns.map((column) => (
                    <SetColumnCell
                      column={column}
                      draft={draftValues[setIndex]?.[column.key] ?? ''}
                      key={`${setIndex}-${column.key}`}
                      onChange={(value) =>
                        setDraftValues((current) => ({
                          ...current,
                          [setIndex]: {
                            ...(current[setIndex] ?? emptyRow()),
                            [column.key]: value,
                          },
                        }))
                      }
                      onOpenRom={() => setRomState({ setIndex })}
                      target={readTargetValue(props.item, setIndex, column.key)}
                    />
                  ))}
                </View>
                <View style={styles.setFooter}>
                  <Pressable style={styles.saveBtn} onPress={() => handleSaveSet(setIndex)}>
                    <Text style={styles.saveBtnText}>{t('mobile.client.session.saveSet')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          {props.item.type === 'strength' ? (
            <Pressable onPress={() => setShowPrevious(true)}>
              <Text style={styles.footerLink}>{t('mobile.client.session.previousDays')}</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}
          <Pressable disabled={finishing} style={styles.finishBtn} onPress={() => void handleFinishExercise()}>
            <Text style={styles.finishBtnText}>{t('mobile.client.session.finishExercise')}</Text>
          </Pressable>
          {props.workoutElapsed ? (
            <View style={styles.footerTimer}>
              <View style={styles.footerDot} />
              <Text style={styles.footerTimerText}>{props.workoutElapsed}</Text>
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )}
        </View>

        <RomScaleModal
          value={draftValues[romState?.setIndex ?? 1]?.rom ?? ''}
          visible={romState != null}
          onClose={() => setRomState(null)}
          onSave={handleRomSave}
        />
        <YouTubeVideoModal
          title={props.item.displayName}
          visible={showVideo}
          youtubeUrl={youtubeUrl}
          onClose={() => setShowVideo(false)}
        />
        <ExerciseCommentModal
          exerciseName={props.item.displayName}
          routineDayLabel={t('client.today.title')}
          sessionId={props.sessionId}
          sessionItemId={getStrengthSessionItemId(props.item)}
          visible={showComment}
          onClose={() => setShowComment(false)}
        />
        {showNotes ? (
          <Modal transparent animationType={'fade'} visible onRequestClose={() => setShowNotes(false)}>
            <Pressable style={styles.notesOverlay} onPress={() => setShowNotes(false)}>
              <View style={styles.notesCard}>
                <ExerciseNotesPanel coachInstructions={props.item.coachInstructions} trainerNote={props.item.notes} />
              </View>
            </Pressable>
          </Modal>
        ) : null}
        <PreviousDaysOverlay
          sourceExerciseId={getSourceExerciseId(props.item)}
          visible={showPrevious}
          onClose={() => setShowPrevious(false)}
        />
        {props.restState?.expanded ? (
          <RestTimerOverlay
            endAt={props.restState.endAt}
            totalSeconds={props.restState.seconds}
            visible
            onHide={props.onCollapseRest}
            onFinish={handleRestComplete}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function SetRestButton(props: {
  active: boolean;
  completed: boolean;
  disabled: boolean;
  endAt: number | null;
  restSeconds: number;
  onExpand: () => void;
  onFinish: () => void;
  onStart: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() =>
    props.endAt ? Math.max(0, Math.ceil((props.endAt - Date.now()) / 1000)) : props.restSeconds,
  );

  useEffect(() => {
    if (!props.active || !props.endAt) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((props.endAt! - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        props.onFinish();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [props.active, props.endAt, props.onFinish]);

  if (props.completed) {
    return (
      <View style={[styles.restBtn, styles.restBtnDone]}>
        <Text style={[styles.restBtnText, styles.restBtnTextDone]}>{t('mobile.client.rest.completed')}</Text>
      </View>
    );
  }

  if (props.active && props.endAt) {
    return (
      <Pressable onPress={props.onExpand} style={styles.restBtnCircle}>
        <CircularCountdown remaining={remaining} size={56} strokeWidth={5} totalSeconds={props.restSeconds} />
      </Pressable>
    );
  }

  return (
    <Pressable disabled={props.disabled} onPress={props.onStart} style={styles.restBtn}>
      <Text style={styles.restBtnText}>{`${t('client.today.restTimer')} ${formatRestLabel(props.restSeconds)}`}</Text>
    </Pressable>
  );
}

function SetColumnCell(props: {
  column: SetColumn;
  draft: string;
  onChange: (value: string) => void;
  onOpenRom: () => void;
  target: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const isRpe = props.column.scale === 'rpe';
  const isRir = props.column.scale === 'rir';
  const isRom = props.column.scale === 'rom';
  const romLabel = isRomScaleValue(props.draft) ? t(`mobile.client.exercise.rom.${props.draft}`) : props.draft;
  const onChangeText = (value: string) => {
    if (isRpe) {
      props.onChange(sanitizeRpeInput(value));
      return;
    }
    if (isRir) {
      props.onChange(sanitizeRirInput(value));
      return;
    }
    props.onChange(value);
  };
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{props.column.label}</Text>
      <Text style={styles.targetValue}>{props.target}</Text>
      {isRom ? (
        <Pressable style={styles.scaleInput} onPress={props.onOpenRom}>
          <Text style={styles.scaleInputText}>{romLabel || '-'}</Text>
        </Pressable>
      ) : props.column.key === 'reps' && props.column.label === '—' ? (
        <Text style={styles.scaleInputText}>{'—'}</Text>
      ) : (
        <TextInput
          keyboardType={isRpe ? 'decimal-pad' : isRir ? 'number-pad' : 'numeric'}
          onChangeText={onChangeText}
          style={styles.input}
          value={props.draft}
        />
      )}
    </View>
  );
}

function ExerciseActionBar(props: {
  onOpenComment: () => void;
  onOpenNotes: () => void;
  onOpenVideo: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.actionBar}>
      <ExerciseActionButton
        icon={<CommentGlyph />}
        iconBg={LIGHT.accent}
        label={t('mobile.client.comment.title')}
        labelColor={LIGHT.accentDark}
        surface={'#dbeafe'}
        onPress={props.onOpenComment}
      />
      <ExerciseActionButton
        icon={<VideoGlyph />}
        iconBg={LIGHT.redBg}
        label={t('mobile.client.exercise.video')}
        labelColor={'#b91c1c'}
        surface={'#fee2e2'}
        onPress={props.onOpenVideo}
      />
      <ExerciseActionButton
        icon={<NotesGlyph />}
        iconBg={LIGHT.orange}
        label={t('mobile.client.exercise.indications')}
        labelColor={'#c2410c'}
        surface={'#ffedd5'}
        onPress={props.onOpenNotes}
      />
    </View>
  );
}

function ExerciseActionButton(props: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  labelColor: string;
  surface: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.actionCard, { backgroundColor: props.surface }]}>
      <View style={[styles.actionIcon, { backgroundColor: props.iconBg }]}>{props.icon}</View>
      <Text numberOfLines={1} style={[styles.actionLabel, { color: props.labelColor }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function CommentGlyph(): React.JSX.Element {
  return (
    <Svg fill={'none'} height={18} viewBox={'0 0 24 24'} width={18}>
      <Path d={'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'} fill={'#ffffff'} />
    </Svg>
  );
}

function VideoGlyph(): React.JSX.Element {
  return (
    <Svg fill={'none'} height={18} viewBox={'0 0 24 24'} width={18}>
      <Path d={'M8 6.5v11l10-5.5L8 6.5z'} fill={'#ffffff'} />
    </Svg>
  );
}

function NotesGlyph(): React.JSX.Element {
  return (
    <Svg fill={'none'} height={18} viewBox={'0 0 24 24'} width={18}>
      <Path d={'M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z'} fill={'#ffffff'} />
      <Path d={'M15 3v5h5'} stroke={'#fb923c'} strokeWidth={1.6} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  navBtn: {
    padding: 4,
  },
  navArrow: {
    color: LIGHT.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  navDisabled: {
    opacity: 0.3,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionCard: {
    alignItems: 'center',
    borderRadius: LIGHT.radiusLg,
    flex: 1,
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  repRange: {
    color: LIGHT.textMuted,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  repRangeValue: {
    color: LIGHT.textStrong,
    fontWeight: '700',
  },
  scroll: {
    gap: 12,
    padding: 16,
    paddingBottom: 100,
  },
  setCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    padding: 16,
  },
  setHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  setTitle: {
    color: LIGHT.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    color: LIGHT.accentMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  targetValue: {
    color: LIGHT.textStrong,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  input: {
    ...SESSION.input,
    fontSize: 16,
    minHeight: 44,
  },
  scaleInput: {
    ...SESSION.input,
    justifyContent: 'center',
    minHeight: 44,
  },
  scaleInputText: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  setFooter: {
    marginTop: 12,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    paddingVertical: 10,
  },
  saveBtnText: {
    color: LIGHT.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  restBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusFull,
    flexDirection: 'row',
    gap: 6,
    minWidth: 112,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  restBtnCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  restBtnDone: {
    backgroundColor: LIGHT.bgSoft,
  },
  restBtnText: {
    color: LIGHT.success,
    fontSize: 12,
    fontWeight: '700',
  },
  restBtnTextDone: {
    color: LIGHT.textMuted,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerLink: {
    color: LIGHT.accent,
    fontSize: 13,
    fontWeight: '700',
    width: 90,
  },
  footerSpacer: {
    width: 90,
  },
  finishBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  finishBtnText: {
    color: LIGHT.textOnNavy,
    fontSize: 14,
    fontWeight: '700',
  },
  footerTimer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    width: 90,
  },
  footerDot: {
    backgroundColor: LIGHT.emerald,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  footerTimerText: {
    color: LIGHT.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  notesOverlay: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  notesCard: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    maxHeight: '70%',
    padding: 16,
    width: '100%',
  },
});
