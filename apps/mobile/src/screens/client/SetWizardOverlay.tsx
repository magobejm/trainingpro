import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import type { ExerciseHistoryEntry, LogSetMutationInput, StrengthSessionItem } from '../../data/hooks/useTodaySession';
import { useExerciseHistoryQuery } from '../../data/hooks/useTodaySession';
import { ExerciseNotesPanel } from './ExerciseNotesPanel';
import { resolvePlannedSet } from './planned-set.utils';
import { IntervalTimer } from '../../features/timers/IntervalTimer';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';

const MODAL_ANIMATION = 'slide';
const BACK_ARROW = '\u2190';
const KEYBOARD_DECIMAL = 'decimal-pad';
const KEYBOARD_NUMBER = 'number-pad';
const KEYBOARD_PERSIST_TAPS = 'handled';
const COLON_SPACE = ': ';
const DOUBLE_DASH = '--';
const PLACEHOLDER_COLOR = LIGHT.textMuted;
const RPE_TRACK_ACTIVE = LIGHT.amber;
const RIR_TRACK_ACTIVE = LIGHT.emerald;
const TRACK_BG = LIGHT.borderStrong;

type SetWizardOverlayProps = {
  item: StrengthSessionItem;
  initialSetIndex?: number;
  editingSetIndex?: number | null;
  sessionId: string;
  onClose: () => void;
  onLogSet: (input: LogSetMutationInput) => void;
};

function HistoryDrawer({ sourceExerciseId }: { sourceExerciseId: string }) {
  const { t } = useTranslation();
  const kgLabel = t('client.label.kg');
  const repsLabel = t('client.label.reps');
  const { data: history } = useExerciseHistoryQuery(sourceExerciseId);

  if (!history || history.length === 0) {
    return <Text style={historyStyles.empty}>{t('client.wizard.noHistory')}</Text>;
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(e: ExerciseHistoryEntry) => e.sessionDate}
      renderItem={({ item: entry }) => (
        <View style={historyStyles.row}>
          <Text style={historyStyles.date}>{entry.sessionDate}</Text>
          <Text style={historyStyles.data}>
            {entry.weightDoneKg != null ? `${entry.weightDoneKg} ${kgLabel}` : DOUBLE_DASH}
            {entry.repsDone != null ? ` · ${entry.repsDone} ${repsLabel}` : ''}
          </Text>
        </View>
      )}
      scrollEnabled={false}
    />
  );
}

function TrainerVarsPanel({
  item,
  currentSet,
  onAutocomplete,
  onClear,
}: {
  item: StrengthSessionItem;
  currentSet: number;
  onAutocomplete: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const plannedSet = resolvePlannedSet(item.plannedSets, currentSet);
  return (
    <View style={styles.trainerVarsPanel}>
      <ExerciseNotesPanel coachInstructions={item.coachInstructions} plannedSet={plannedSet} trainerNote={item.notes} />
      {item.restSeconds != null && (
        <Text style={styles.restBanner}>{t('client.wizard.restRecommended', { seconds: item.restSeconds })}</Text>
      )}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={onAutocomplete}>
          <Text style={styles.actionBtnText}>{t('client.wizard.autocomplete')}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={onClear}>
          <Text style={styles.actionBtnTextSecondary}>{t('client.wizard.clear')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InputGrid({
  reps,
  weight,
  repsPlaceholder,
  weightPlaceholder,
  onRepsChange,
  onWeightChange,
}: {
  reps: string;
  weight: string;
  repsPlaceholder: string;
  weightPlaceholder: string;
  onRepsChange: (v: string) => void;
  onWeightChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.inputGrid}>
      <View style={styles.inputCell}>
        <Text style={styles.inputLabel}>{t('client.wizard.reps')}</Text>
        <TextInput
          style={styles.input}
          value={reps}
          onChangeText={onRepsChange}
          keyboardType={KEYBOARD_NUMBER}
          placeholder={repsPlaceholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
        />
      </View>
      <View style={styles.inputCell}>
        <Text style={styles.inputLabel}>
          {t('client.wizard.weight')}
          {COLON_SPACE}
          {t('client.label.kg')}
        </Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={onWeightChange}
          keyboardType={KEYBOARD_DECIMAL}
          placeholder={weightPlaceholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
        />
      </View>
    </View>
  );
}

function EffortSliders({
  rpe,
  rir,
  onRpeChange,
  onRirChange,
}: {
  rpe: number;
  rir: number;
  onRpeChange: (v: number) => void;
  onRirChange: (v: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.sliderSection}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{t('client.label.rpe')}</Text>
          <Text style={styles.sliderValue}>{rpe}</Text>
        </View>
        <Slider
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={rpe}
          onValueChange={onRpeChange}
          minimumTrackTintColor={RPE_TRACK_ACTIVE}
          maximumTrackTintColor={TRACK_BG}
          thumbTintColor={RPE_TRACK_ACTIVE}
        />
      </View>
      <View style={styles.sliderSection}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{t('client.label.rir')}</Text>
          <Text style={styles.sliderValue}>{rir}</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={rir}
          onValueChange={onRirChange}
          minimumTrackTintColor={RIR_TRACK_ACTIVE}
          maximumTrackTintColor={TRACK_BG}
          thumbTintColor={RIR_TRACK_ACTIVE}
        />
      </View>
    </>
  );
}

// eslint-disable-next-line max-lines-per-function
export function SetWizardOverlay({ item, initialSetIndex, editingSetIndex, onClose, onLogSet }: SetWizardOverlayProps) {
  const { t } = useTranslation();
  const isEditing = editingSetIndex != null;
  const setsPlanned = item.setsPlanned ?? 1;
  const [currentSet, setCurrentSet] = useState(initialSetIndex ?? 1);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrainerVars, setShowTrainerVars] = useState(false);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState(7);
  const [rir, setRir] = useState(2);
  const [restPhase, setRestPhase] = useState(false);

  const existingLog = item.logs.find((l) => l.setIndex === currentSet);

  const prefillFromExisting = useCallback(() => {
    if (existingLog) {
      if (existingLog.repsDone != null) setReps(String(existingLog.repsDone));
      if (existingLog.weightDoneKg != null) setWeight(String(existingLog.weightDoneKg));
      if (existingLog.effortRpe != null) setRpe(existingLog.effortRpe);
      if (existingLog.effortRir != null) setRir(existingLog.effortRir);
    }
  }, [existingLog]);

  useEffect(() => {
    if (editingSetIndex != null) {
      setCurrentSet(editingSetIndex);
    }
    prefillFromExisting();
  }, [editingSetIndex, prefillFromExisting]);

  const handleAutocomplete = useCallback(() => {
    if (item.repsMax != null) setReps(String(item.repsMax));
    if (item.weightRangeMaxKg != null) setWeight(String(item.weightRangeMaxKg));
    if (item.targetRpe != null) setRpe(item.targetRpe);
    if (item.targetRir != null) setRir(item.targetRir);
  }, [item]);

  const handleClear = useCallback(() => {
    setReps('');
    setWeight('');
    setRpe(7);
    setRir(2);
  }, []);

  const commitSet = useCallback(() => {
    onLogSet({
      effortRir: rir,
      effortRpe: rpe,
      repsDone: reps ? Number(reps) : null,
      sessionItemId: item.id,
      setIndex: currentSet,
      weightDoneKg: weight ? Number(weight) : null,
    });
  }, [onLogSet, rir, rpe, reps, item.id, currentSet, weight]);

  const advanceSet = useCallback(() => {
    setRestPhase(false);
    if (currentSet < setsPlanned) {
      setCurrentSet((prev) => prev + 1);
      setReps('');
      setWeight('');
      setRpe(7);
      setRir(2);
    } else {
      onClose();
    }
  }, [currentSet, onClose, setsPlanned]);

  const handlePrimary = useCallback(() => {
    commitSet();
    if (isEditing) {
      onClose();
      return;
    }
    const hasRest = !isEditing && item.restSeconds != null && item.restSeconds > 0 && currentSet < setsPlanned;
    if (hasRest) {
      setRestPhase(true);
    } else {
      advanceSet();
    }
  }, [advanceSet, commitSet, currentSet, isEditing, item.restSeconds, onClose, setsPlanned]);

  const isLastSet = currentSet >= setsPlanned;
  const ctaLabel = isEditing
    ? t('client.wizard.saveChanges')
    : isLastSet
      ? t('client.wizard.finishExercise')
      : t('client.wizard.completeAndRest');

  const repsPlaceholder = item.repsMax != null ? String(item.repsMax) : DOUBLE_DASH;
  const weightPlaceholder = item.weightRangeMaxKg != null ? String(item.weightRangeMaxKg) : DOUBLE_DASH;

  return (
    <Modal visible animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backArrow}>{BACK_ARROW}</Text>
          </Pressable>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Pressable
            style={[styles.historyBtn, showHistory && styles.historyBtnActive]}
            onPress={() => setShowHistory((v) => !v)}
          >
            <Text style={styles.historyBtnText}>{t('client.wizard.history')}</Text>
          </Pressable>
        </View>

        {showHistory && item.sourceExerciseId ? (
          <View style={styles.historyPanel}>
            <HistoryDrawer sourceExerciseId={item.sourceExerciseId} />
          </View>
        ) : null}

        <ScrollView style={styles.body} keyboardShouldPersistTaps={KEYBOARD_PERSIST_TAPS}>
          <Text style={styles.setLabel}>{t('client.wizard.serieOf', { current: currentSet, total: setsPlanned })}</Text>

          <Pressable style={styles.trainerVarsRow} onPress={() => setShowTrainerVars((v) => !v)}>
            <Text style={styles.trainerVarsText}>{t('client.wizard.trainerVars')}</Text>
            <Text style={styles.trainerVarsChevron}>{showTrainerVars ? '\u25BC' : '\u25B6'}</Text>
          </Pressable>

          {showTrainerVars ? (
            <TrainerVarsPanel
              currentSet={currentSet}
              item={item}
              onAutocomplete={handleAutocomplete}
              onClear={handleClear}
            />
          ) : null}

          <ExerciseNotesPanel
            coachInstructions={showTrainerVars ? null : item.coachInstructions}
            plannedSet={showTrainerVars ? null : resolvePlannedSet(item.plannedSets, currentSet)}
            trainerNote={showTrainerVars ? null : item.notes}
          />

          <InputGrid
            reps={reps}
            weight={weight}
            repsPlaceholder={repsPlaceholder}
            weightPlaceholder={weightPlaceholder}
            onRepsChange={setReps}
            onWeightChange={setWeight}
          />

          <EffortSliders rpe={rpe} rir={rir} onRpeChange={setRpe} onRirChange={setRir} />
        </ScrollView>

        {restPhase && item.restSeconds != null ? (
          <View style={styles.restOverlay}>
            <Text style={styles.restTitle}>{t('client.today.restTimer')}</Text>
            <IntervalTimer
              seconds={item.restSeconds}
              startLabel={t('client.today.startTimer')}
              pauseLabel={t('client.today.pause')}
              resetLabel={t('client.today.reset')}
              runningLabel={t('client.today.restTimer')}
              onComplete={advanceSet}
            />
            <Pressable style={styles.skipRestBtn} onPress={advanceSet}>
              <Text style={styles.ctaBtnText}>{t('client.wizard.completeAndRest')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footer}>
            <Pressable style={styles.ctaBtn} onPress={handlePrimary}>
              <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: SESSION.modalOverlay,
  header: {
    ...SESSION.header,
    alignItems: 'center',
    flexDirection: 'row',
  },
  backBtn: SESSION.backBtn,
  backArrow: SESSION.backArrow,
  exerciseName: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyBtn: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyBtnActive: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.accent,
  },
  historyBtnText: {
    color: LIGHT.accentDark,
    fontSize: 12,
    fontWeight: '600',
  },
  historyPanel: {
    ...SESSION.panel,
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    borderRadius: 0,
    marginBottom: 0,
  },
  body: SESSION.screenPadding,
  setLabel: {
    color: LIGHT.accent,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  trainerVarsRow: {
    ...SESSION.panel,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trainerVarsText: { color: LIGHT.textMuted, fontSize: 14, fontWeight: '600' },
  trainerVarsChevron: { color: LIGHT.textMuted, fontSize: 10 },
  trainerVarsPanel: { ...SESSION.panel, gap: 8, marginBottom: 12 },
  trainerHint: { color: LIGHT.textMuted, fontSize: 13 },
  restBanner: {
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusSm,
    color: LIGHT.success,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { ...SESSION.primaryBtn, borderRadius: LIGHT.radiusSm, flex: 1, paddingVertical: 8 },
  actionBtnSecondary: SESSION.secondaryBtn,
  actionBtnText: { ...SESSION.primaryBtnText, fontSize: 13 },
  actionBtnTextSecondary: { ...SESSION.secondaryBtnText, fontSize: 13 },
  inputGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputCell: { flex: 1 },
  inputLabel: SESSION.inputLabel,
  input: SESSION.input,
  sliderSection: { marginBottom: 12 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { color: LIGHT.text, fontSize: 14, fontWeight: '600' },
  sliderValue: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '700' },
  footer: { borderTopColor: LIGHT.border, borderTopWidth: 1, padding: 16 },
  ctaBtn: SESSION.primaryBtn,
  ctaBtnText: SESSION.primaryBtnText,
  restOverlay: {
    backgroundColor: LIGHT.emeraldSoft,
    borderTopColor: LIGHT.emerald,
    borderTopWidth: 2,
    gap: 12,
    padding: 16,
  },
  restTitle: { color: LIGHT.success, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  skipRestBtn: { ...SESSION.primaryBtnSuccess, borderRadius: LIGHT.radiusMd, paddingVertical: 12 },
});

const historyStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  date: { color: LIGHT.textMuted, fontSize: 12 },
  data: { color: LIGHT.text, fontSize: 12, fontWeight: '600' },
  empty: { color: LIGHT.textMuted, fontSize: 13, textAlign: 'center' },
});
