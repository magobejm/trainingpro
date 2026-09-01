/* eslint-disable max-lines, max-lines-per-function -- unified active exercise matrix with inline set editors and modals. */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import {
  buildLogPayload,
  getRestSeconds,
  getSetColumns,
  getSetCount,
  getSourceExerciseId,
  getStrengthSessionItemId,
  readActualValue,
  readTargetValue,
  type SetColumn,
  type SetFieldKey,
} from './active-exercise.helpers';
import { ExerciseCommentModal } from './ExerciseCommentModal';
import { ExerciseNotesPanel } from './ExerciseNotesPanel';
import { formatRestLabel } from './session-completion.utils';
import { PreviousDaysOverlay } from './PreviousDaysOverlay';
import { resolvePlannedSet } from './planned-set.utils';
import { ScaleModal } from './ScaleModal';
import { SetNoteModal } from './SetNoteModal';

type ActiveExerciseScreenProps = {
  exerciseGroup: SessionItem[];
  item: SessionItem;
  sessionId: string;
  visible: boolean;
  workoutElapsed?: string;
  completedRestKeys: string[];
  onClose: () => void;
  onFinishExercise: () => void;
  onNavigateExercise: (item: SessionItem) => void;
  onLogInterval: (input: LogIntervalMutationInput) => void;
  onLogIsometricSet: (input: LogIsometricSetMutationInput) => void;
  onLogMobilitySet: (input: LogMobilitySetMutationInput) => void;
  onLogPlioSet: (input: LogPlioSetMutationInput) => void;
  onLogSet: (input: LogSetMutationInput) => void;
  onLogSport: (input: LogSportMutationInput) => void;
  onStartRest: (setKey: string, seconds: number) => void;
};

type ScaleState = { kind: 'rpe' | 'rir'; setIndex: number } | null;

function emptyRow(): Record<SetFieldKey, string> {
  return {
    distance: '',
    duration: '',
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
  const [setNoteIndex, setSetNoteIndex] = useState<number | null>(null);
  const [scaleState, setScaleState] = useState<ScaleState>(null);
  const [draftValues, setDraftValues] = useState<Record<number, Record<SetFieldKey, string>>>({});

  const groupIndex = props.exerciseGroup.findIndex((entry) => entry.id === props.item.id);
  const setCount = getSetCount(props.item);
  const columns = getSetColumns(props.item);

  useEffect(() => {
    const next: Record<number, Record<SetFieldKey, string>> = {};
    for (let setIndex = 1; setIndex <= setCount; setIndex += 1) {
      const row: Record<SetFieldKey, string> = {
        distance: readActualValue(props.item, setIndex, 'distance'),
        duration: readActualValue(props.item, setIndex, 'duration'),
        heartRate: readActualValue(props.item, setIndex, 'heartRate'),
        reps: readActualValue(props.item, setIndex, 'reps'),
        rest: '',
        rir: readActualValue(props.item, setIndex, 'rir'),
        rpe: readActualValue(props.item, setIndex, 'rpe'),
        rom: readActualValue(props.item, setIndex, 'rom'),
        weight: readActualValue(props.item, setIndex, 'weight'),
      };
      next[setIndex] = row;
    }
    setDraftValues(next);
  }, [props.item, setCount]);

  const handleSaveSet = (setIndex: number) => {
    const values = draftValues[setIndex];
    if (!values) return;
    const payload = buildLogPayload(props.item, setIndex, values);
    if (!payload) return;
    if ('sessionItemId' in payload) props.onLogSet(payload);
    else if ('sessionPlioBlockId' in payload) props.onLogPlioSet(payload);
    else if ('sessionMobilityBlockId' in payload) props.onLogMobilitySet(payload);
    else if ('sessionIsometricBlockId' in payload) props.onLogIsometricSet(payload);
    else if ('sessionCardioBlockId' in payload) props.onLogInterval(payload);
    else if ('sessionSportBlockId' in payload) props.onLogSport(payload);
  };

  const handleScaleSave = (value: number) => {
    if (!scaleState) return;
    const key = scaleState.kind === 'rpe' ? 'rpe' : 'rir';
    setDraftValues((current) => ({
      ...current,
      [scaleState.setIndex]: {
        ...(current[scaleState.setIndex] ?? emptyRow()),
        [key]: String(value),
      },
    }));
    setScaleState(null);
  };

  const navigateGroup = (direction: -1 | 1) => {
    const next = props.exerciseGroup[groupIndex + direction];
    if (next) props.onNavigateExercise(next);
  };

  const repsRange =
    props.item.type === 'strength' && props.item.repsMin && props.item.repsMax
      ? `${props.item.repsMin}-${props.item.repsMax}`
      : null;

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
          <View style={styles.headerActions}>
            <Pressable style={styles.actionBtn} onPress={() => setShowComment(true)}>
              <Text>{'💬'}</Text>
            </Pressable>
            <Pressable disabled style={[styles.actionBtn, styles.actionBtnDisabled]} onPress={() => {}}>
              <Text>{'🎬'}</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => setShowNotes(true)}>
              <Text>{'📄'}</Text>
            </Pressable>
          </View>
        </View>

        {repsRange ? (
          <Text style={styles.repRange}>
            {t('mobile.client.session.repRange')} <Text style={styles.repRangeValue}>{repsRange}</Text>
          </Text>
        ) : null}

        <ScrollView contentContainerStyle={styles.scroll}>
          {Array.from({ length: setCount }, (_, index) => {
            const setIndex = index + 1;
            const setKey = `${props.item.id}:${setIndex}`;
            const restDone = props.completedRestKeys.includes(setKey);
            const restSeconds = getRestSeconds(props.item);
            return (
              <View key={setKey} style={styles.setCard}>
                <View style={styles.setHeader}>
                  <Text style={styles.setTitle}>{`${t('client.today.set')} ${setIndex}`}</Text>
                  <Pressable onPress={() => setSetNoteIndex(setIndex)}>
                    <Text>{'📄'}</Text>
                  </Pressable>
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
                      onOpenScale={() => setScaleState({ kind: column.scale === 'rpe' ? 'rpe' : 'rir', setIndex })}
                      target={readTargetValue(props.item, setIndex, column.key)}
                    />
                  ))}
                </View>
                <View style={styles.setFooter}>
                  <Pressable style={styles.saveBtn} onPress={() => handleSaveSet(setIndex)}>
                    <Text style={styles.saveBtnText}>{t('mobile.client.session.saveSet')}</Text>
                  </Pressable>
                  {restSeconds > 0 ? (
                    <Pressable
                      disabled={restDone}
                      onPress={() => props.onStartRest(setKey, restSeconds)}
                      style={[styles.restBtn, restDone && styles.restBtnDone]}
                    >
                      <Text style={[styles.restBtnText, restDone && styles.restBtnTextDone]}>
                        {restDone
                          ? t('mobile.client.rest.completed')
                          : `${t('client.today.restTimer')} ${formatRestLabel(restSeconds)}`}
                      </Text>
                    </Pressable>
                  ) : null}
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
          <Pressable style={styles.finishBtn} onPress={props.onFinishExercise}>
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

        <ScaleModal
          kind={scaleState?.kind ?? 'rpe'}
          value={Number(
            draftValues[scaleState?.setIndex ?? 1]?.[scaleState?.kind === 'rpe' ? 'rpe' : 'rir'] ??
              (scaleState?.kind === 'rpe' ? 8 : 2),
          )}
          visible={scaleState != null}
          onChange={() => {}}
          onClose={() => setScaleState(null)}
          onSave={handleScaleSave}
        />
        <SetNoteModal
          item={props.item}
          setIndex={setNoteIndex}
          visible={setNoteIndex != null}
          onClose={() => setSetNoteIndex(null)}
        />
        <ExerciseCommentModal
          sessionId={props.sessionId}
          sessionItemId={getStrengthSessionItemId(props.item)}
          visible={showComment}
          onClose={() => setShowComment(false)}
        />
        {showNotes ? (
          <Modal transparent animationType={'fade'} visible onRequestClose={() => setShowNotes(false)}>
            <Pressable style={styles.notesOverlay} onPress={() => setShowNotes(false)}>
              <View style={styles.notesCard}>
                <ExerciseNotesPanel
                  coachInstructions={props.item.coachInstructions}
                  plannedSet={resolvePlannedSet(props.item.plannedSets, 1)}
                  trainerNote={props.item.notes}
                />
              </View>
            </Pressable>
          </Modal>
        ) : null}
        <PreviousDaysOverlay
          sourceExerciseId={getSourceExerciseId(props.item)}
          visible={showPrevious}
          onClose={() => setShowPrevious(false)}
        />
      </View>
    </Modal>
  );
}

function SetColumnCell(props: {
  column: SetColumn;
  draft: string;
  onChange: (value: string) => void;
  onOpenScale: () => void;
  target: string;
}): React.JSX.Element {
  const isScale = props.column.scale === 'rpe' || props.column.scale === 'rir';
  const isRom = props.column.scale === 'rom';
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{props.column.label}</Text>
      <Text style={styles.targetValue}>{props.target}</Text>
      {isScale || isRom ? (
        <Pressable style={styles.scaleInput} onPress={isScale ? props.onOpenScale : undefined}>
          <Text style={styles.scaleInputText}>{props.draft || '-'}</Text>
        </Pressable>
      ) : props.column.key === 'reps' && props.column.label === '—' ? (
        <Text style={styles.scaleInputText}>{'—'}</Text>
      ) : (
        <TextInput keyboardType={'numeric'} onChangeText={props.onChange} style={styles.input} value={props.draft} />
      )}
    </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionBtnDisabled: {
    opacity: 0.4,
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
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
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
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 10,
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
