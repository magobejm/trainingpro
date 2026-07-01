import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IntervalTimer } from '../../features/timers/IntervalTimer';
import type { LogMobilitySetMutationInput, MobilitySessionItem } from '../../data/hooks/useTodaySession';
import { LIGHT } from '../../theme/light';

type Phase = 'work' | 'rest' | 'done';

const ROM_OPTIONS = ['completo', 'parcial', 'limitado'];
const MODAL_ANIMATION = 'slide';
const KEYBOARD_NUMBER = 'number-pad';
const PLACEHOLDER_COLOR = LIGHT.textMuted;
const PLACEHOLDER_DASH = '--';

type MobilityBlockOverlayProps = {
  item: MobilitySessionItem;
  sessionId: string;
  onClose: () => void;
  onLogSet: (input: LogMobilitySetMutationInput) => void;
};

type MobilityWorkPhaseProps = {
  item: MobilitySessionItem;
  reps: string;
  rom: string;
  rpe: string;
  setReps: (v: string) => void;
  setRom: (v: string) => void;
  setRpe: (v: string) => void;
  onRegister: () => void;
};

function MobilityWorkPhase({ item, reps, rom, rpe, setReps, setRom, setRpe, onRegister }: MobilityWorkPhaseProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.mobilityWizard.work')}</Text>
      <IntervalTimer
        seconds={item.workSeconds}
        startLabel={t('client.mobilityWizard.startTimer')}
        pauseLabel={t('client.mobilityWizard.pauseTimer')}
        resetLabel={t('client.mobilityWizard.resetTimer')}
        runningLabel={t('client.mobilityWizard.timerRunning')}
      />
      <View style={styles.inputs}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('client.label.reps')}</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType={KEYBOARD_NUMBER}
            placeholder={PLACEHOLDER_DASH}
            placeholderTextColor={PLACEHOLDER_COLOR}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('client.mobilityWizard.rom')}</Text>
          <View style={styles.romRow}>
            {ROM_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.romChip, rom === opt && styles.romChipSelected]}
                onPress={() => setRom(rom === opt ? '' : opt)}
              >
                <Text style={[styles.romChipText, rom === opt && styles.romChipTextSelected]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('client.label.rpe')}</Text>
          <TextInput
            style={styles.input}
            value={rpe}
            onChangeText={setRpe}
            keyboardType={KEYBOARD_NUMBER}
            placeholder={PLACEHOLDER_DASH}
            placeholderTextColor={PLACEHOLDER_COLOR}
          />
        </View>
      </View>
      <Pressable style={styles.ctaButton} onPress={onRegister}>
        <Text style={styles.ctaText}>{t('client.mobilityWizard.registerRound')}</Text>
      </Pressable>
    </>
  );
}

function MobilityRestPhase({ restSeconds, onComplete }: { restSeconds: number; onComplete: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.mobilityWizard.rest')}</Text>
      <IntervalTimer
        seconds={restSeconds}
        startLabel={t('client.mobilityWizard.startTimer')}
        pauseLabel={t('client.mobilityWizard.pauseTimer')}
        resetLabel={t('client.mobilityWizard.resetTimer')}
        runningLabel={t('client.mobilityWizard.timerRunning')}
        onComplete={onComplete}
      />
      <Pressable style={[styles.ctaButton, styles.ctaSecondary]} onPress={onComplete}>
        <Text style={styles.ctaText}>{t('client.mobilityWizard.skipRest')}</Text>
      </Pressable>
    </>
  );
}

export function MobilityBlockOverlay({ item, onClose, onLogSet }: MobilityBlockOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const currentRound = item.logs.length + 1;
  const totalRounds = item.roundsPlanned;
  const isFinished = item.logs.length >= totalRounds;

  const [phase, setPhase] = useState<Phase>(isFinished ? 'done' : 'work');
  const [reps, setReps] = useState('');
  const [rom, setRom] = useState('');
  const [rpe, setRpe] = useState('');

  const handleRestComplete = useCallback(() => {
    setPhase('work');
    setReps('');
    setRom('');
    setRpe('');
  }, []);

  const handleRegister = useCallback(() => {
    onLogSet({
      effortRpe: rpe ? Number(rpe) : null,
      repsDone: reps ? Number(reps) : null,
      romDone: rom || null,
      sessionMobilityBlockId: item.id,
      setIndex: currentRound,
    });
    const isLast = currentRound >= totalRounds;
    if (isLast) {
      setPhase('done');
    } else if (item.restSeconds > 0) {
      setPhase('rest');
    } else {
      setReps('');
      setRom('');
      setRpe('');
    }
  }, [currentRound, item.id, item.restSeconds, onLogSet, reps, rom, rpe, totalRounds]);

  return (
    <Modal animationType={MODAL_ANIMATION} visible onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('client.mobilityWizard.back')}</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {item.displayName}
          </Text>
          <Text style={styles.progress}>
            {t('client.mobilityWizard.round', { current: Math.min(currentRound, totalRounds), total: totalRounds })}
          </Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {phase === 'work' && !isFinished && (
            <MobilityWorkPhase
              item={item}
              reps={reps}
              rom={rom}
              rpe={rpe}
              setReps={setReps}
              setRom={setRom}
              setRpe={setRpe}
              onRegister={handleRegister}
            />
          )}
          {phase === 'rest' && item.restSeconds > 0 && (
            <MobilityRestPhase restSeconds={item.restSeconds} onComplete={handleRestComplete} />
          )}
          {(phase === 'done' || isFinished) && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneText}>{t('client.mobilityWizard.finishBlock')}</Text>
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

const styles = StyleSheet.create({
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: LIGHT.textMuted,
    fontSize: 14,
  },
  container: {
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginTop: 16,
    padding: 16,
  },
  ctaSecondary: {
    backgroundColor: LIGHT.accentSoft,
  },
  ctaText: {
    color: LIGHT.textOnNavy,
    fontSize: 16,
    fontWeight: '700',
  },
  doneContainer: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 32,
  },
  doneText: {
    color: LIGHT.success,
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    backgroundColor: LIGHT.bgCard,
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    gap: 4,
    padding: 16,
    paddingTop: 48,
  },
  input: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 16,
    minWidth: 80,
    padding: 10,
    textAlign: 'center',
  },
  inputLabel: {
    color: LIGHT.textMuted,
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
    color: LIGHT.textMuted,
    fontSize: 13,
  },
  romChip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  romChipSelected: {
    backgroundColor: LIGHT.accent,
    borderColor: LIGHT.accent,
  },
  romChipText: {
    color: LIGHT.textMuted,
    fontSize: 12,
  },
  romChipTextSelected: {
    color: LIGHT.textOnNavy,
  },
  romRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    color: LIGHT.accentMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 20,
    fontWeight: '700',
  },
});
