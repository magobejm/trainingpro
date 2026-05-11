import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import type { ExerciseHistoryEntry, LogSetMutationInput, StrengthSessionItem } from '../../data/hooks/useTodaySession';
import { useExerciseHistoryQuery } from '../../data/hooks/useTodaySession';

const MODAL_ANIMATION = 'slide';
const BACK_ARROW = '\u2190';
const KEYBOARD_DECIMAL = 'decimal-pad';
const KEYBOARD_NUMBER = 'number-pad';
const KEYBOARD_PERSIST_TAPS = 'handled';
const COLON_SPACE = ': ';
const DOUBLE_DASH = '--';
const PLACEHOLDER_COLOR = '#475569';
const RPE_TRACK_ACTIVE = '#f59e0b';
const RIR_TRACK_ACTIVE = '#10b981';
const TRACK_BG = '#334155';

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
  onAutocomplete,
  onClear,
}: {
  item: StrengthSessionItem;
  onAutocomplete: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.trainerVarsPanel}>
      {item.notes ? (
        <Text style={styles.trainerHint}>
          {t('client.wizard.hints')}
          {COLON_SPACE}
          {item.notes}
        </Text>
      ) : null}
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

  const handlePrimary = useCallback(() => {
    commitSet();
    if (isEditing) {
      onClose();
      return;
    }
    if (currentSet < setsPlanned) {
      setCurrentSet((prev) => prev + 1);
      setReps('');
      setWeight('');
      setRpe(7);
      setRir(2);
    } else {
      onClose();
    }
  }, [commitSet, isEditing, onClose, currentSet, setsPlanned]);

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
            <TrainerVarsPanel item={item} onAutocomplete={handleAutocomplete} onClear={handleClear} />
          ) : null}

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

        <View style={styles.footer}>
          <Pressable style={styles.ctaBtn} onPress={handlePrimary}>
            <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    paddingRight: 12,
  },
  backArrow: {
    color: '#94a3b8',
    fontSize: 20,
  },
  exerciseName: {
    color: '#e2e8f0',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyBtnActive: {
    backgroundColor: '#6366f1',
  },
  historyBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  historyPanel: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
    padding: 16,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  setLabel: {
    color: '#6366f1',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  trainerVarsRow: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  trainerVarsText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  trainerVarsChevron: { color: '#94a3b8', fontSize: 10 },
  trainerVarsPanel: { backgroundColor: '#1e293b', borderRadius: 8, gap: 8, marginBottom: 12, padding: 12 },
  trainerHint: { color: '#94a3b8', fontSize: 13 },
  restBanner: {
    backgroundColor: '#1d4ed8',
    borderRadius: 6,
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#6366f1', borderRadius: 6, flex: 1, paddingVertical: 8 },
  actionBtnSecondary: { backgroundColor: '#334155' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  actionBtnTextSecondary: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  inputGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputCell: { flex: 1 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '700',
    padding: 12,
    textAlign: 'center',
  },
  sliderSection: { marginBottom: 12 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sliderLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  sliderValue: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  footer: { borderTopColor: '#1e293b', borderTopWidth: 1, padding: 16 },
  ctaBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
});

const historyStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  date: { color: '#64748b', fontSize: 12 },
  data: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  empty: { color: '#475569', fontSize: 13, textAlign: 'center' },
});
