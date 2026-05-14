import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IntervalTimer } from '../../features/timers/IntervalTimer';
import type { LogPlioSetMutationInput, PlioSessionItem } from '../../data/hooks/useTodaySession';

type Phase = 'work' | 'rest' | 'done';

type PlioBlockOverlayProps = {
  item: PlioSessionItem;
  sessionId: string;
  onClose: () => void;
  onLogSet: (input: LogPlioSetMutationInput) => void;
};

const MODAL_ANIMATION = 'slide';
const KEYBOARD_DECIMAL = 'decimal-pad';
const KEYBOARD_NUMBER = 'number-pad';
const PLACEHOLDER_COLOR = '#475569';
const PLACEHOLDER_DASH = '--';

type PlioWorkPhaseProps = {
  item: PlioSessionItem;
  reps: string;
  weight: string;
  rpe: string;
  setReps: (v: string) => void;
  setWeight: (v: string) => void;
  setRpe: (v: string) => void;
  onRegister: () => void;
};

function PlioWorkPhase({ item, reps, weight, rpe, setReps, setWeight, setRpe, onRegister }: PlioWorkPhaseProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.plioWizard.work')}</Text>
      <IntervalTimer
        seconds={item.workSeconds}
        startLabel={t('client.plioWizard.startTimer')}
        pauseLabel={t('client.plioWizard.pauseTimer')}
        resetLabel={t('client.plioWizard.resetTimer')}
        runningLabel={t('client.plioWizard.timerRunning')}
      />
      <View style={styles.inputs}>
        <InputRow
          label={t('client.label.reps')}
          value={reps}
          onChangeText={setReps}
          keyboardType={KEYBOARD_NUMBER}
          placeholderColor={PLACEHOLDER_COLOR}
        />
        <InputRow
          label={t('client.label.kg')}
          value={weight}
          onChangeText={setWeight}
          keyboardType={KEYBOARD_DECIMAL}
          placeholderColor={PLACEHOLDER_COLOR}
        />
        <InputRow
          label={t('client.label.rpe')}
          value={rpe}
          onChangeText={setRpe}
          keyboardType={KEYBOARD_NUMBER}
          placeholderColor={PLACEHOLDER_COLOR}
        />
      </View>
      <Pressable style={styles.ctaButton} onPress={onRegister}>
        <Text style={styles.ctaText}>{t('client.plioWizard.registerRound')}</Text>
      </Pressable>
    </>
  );
}

function PlioRestPhase({ restSeconds, onComplete }: { restSeconds: number; onComplete: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.plioWizard.rest')}</Text>
      <IntervalTimer
        seconds={restSeconds}
        startLabel={t('client.plioWizard.startTimer')}
        pauseLabel={t('client.plioWizard.pauseTimer')}
        resetLabel={t('client.plioWizard.resetTimer')}
        runningLabel={t('client.plioWizard.timerRunning')}
        onComplete={onComplete}
      />
      <Pressable style={[styles.ctaButton, styles.ctaSecondary]} onPress={onComplete}>
        <Text style={styles.ctaText}>{t('client.plioWizard.skipRest')}</Text>
      </Pressable>
    </>
  );
}

export function PlioBlockOverlay({ item, onClose, onLogSet }: PlioBlockOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const currentRound = item.logs.length + 1;
  const totalRounds = item.roundsPlanned;
  const isFinished = item.logs.length >= totalRounds;

  const [phase, setPhase] = useState<Phase>(isFinished ? 'done' : 'work');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');

  const handleRestComplete = useCallback(() => {
    setPhase('work');
    setReps('');
    setWeight('');
    setRpe('');
  }, []);

  const handleRegister = useCallback(() => {
    onLogSet({
      effortRpe: rpe ? Number(rpe) : null,
      repsDone: reps ? Number(reps) : null,
      sessionPlioBlockId: item.id,
      setIndex: currentRound,
      weightDoneKg: weight ? Number(weight) : null,
    });
    const isLast = currentRound >= totalRounds;
    if (isLast) {
      setPhase('done');
    } else if (item.restSeconds > 0) {
      setPhase('rest');
    } else {
      setReps('');
      setWeight('');
      setRpe('');
    }
  }, [currentRound, item.id, item.restSeconds, onLogSet, reps, rpe, totalRounds, weight]);

  return (
    <Modal animationType={MODAL_ANIMATION} visible onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('client.plioWizard.back')}</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {item.displayName}
          </Text>
          <Text style={styles.progress}>
            {t('client.plioWizard.round', { current: Math.min(currentRound, totalRounds), total: totalRounds })}
          </Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {phase === 'work' && !isFinished && (
            <PlioWorkPhase
              item={item}
              reps={reps}
              weight={weight}
              rpe={rpe}
              setReps={setReps}
              setWeight={setWeight}
              setRpe={setRpe}
              onRegister={handleRegister}
            />
          )}
          {phase === 'rest' && item.restSeconds > 0 && (
            <PlioRestPhase restSeconds={item.restSeconds} onComplete={handleRestComplete} />
          )}
          {(phase === 'done' || isFinished) && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneText}>{t('client.plioWizard.finishBlock')}</Text>
              <Pressable style={styles.ctaButton} onPress={onClose}>
                <Text style={styles.ctaText}>{t('client.wizard.close')}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function InputRow({
  keyboardType,
  label,
  onChangeText,
  placeholderColor,
  value,
}: {
  keyboardType: 'decimal-pad' | 'number-pad';
  label: string;
  onChangeText: (v: string) => void;
  placeholderColor: string;
  value: string;
}) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={PLACEHOLDER_DASH}
        placeholderTextColor={placeholderColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  container: {
    backgroundColor: '#0f172a',
    flex: 1,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: '#225fdb',
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  ctaSecondary: {
    backgroundColor: '#334155',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneContainer: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 32,
  },
  doneText: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
    gap: 4,
    padding: 16,
    paddingTop: 48,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: 16,
    minWidth: 80,
    padding: 10,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#94a3b8',
    flex: 1,
    fontSize: 14,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  inputs: {
    gap: 4,
    marginTop: 16,
  },
  progress: {
    color: '#64748b',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
  },
});
