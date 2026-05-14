import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IntervalTimer } from '../../features/timers/IntervalTimer';
import type { IsometricSessionItem, LogIsometricSetMutationInput } from '../../data/hooks/useTodaySession';

type Phase = 'hold' | 'rest' | 'done';

const MODAL_ANIMATION = 'slide';
const KEYBOARD_DECIMAL = 'decimal-pad';
const KEYBOARD_NUMBER = 'number-pad';
const PLACEHOLDER_COLOR = '#475569';
const PLACEHOLDER_DASH = '--';

type IsometricBlockOverlayProps = {
  item: IsometricSessionItem;
  sessionId: string;
  onClose: () => void;
  onLogSet: (input: LogIsometricSetMutationInput) => void;
};

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

type IsometricHoldPhaseProps = {
  elapsedSeconds: number;
  isHolding: boolean;
  weight: string;
  rpe: string;
  setWeight: (v: string) => void;
  setRpe: (v: string) => void;
  onToggleHold: () => void;
  onRegister: () => void;
};

function IsometricHoldPhase({
  elapsedSeconds,
  isHolding,
  weight,
  rpe,
  setWeight,
  setRpe,
  onToggleHold,
  onRegister,
}: IsometricHoldPhaseProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.isometricWizard.hold')}</Text>
      <View style={styles.chronoCard}>
        <Text style={styles.chronoTime}>{formatSeconds(elapsedSeconds)}</Text>
        <Text style={styles.chronoLabel}>{t('client.isometricWizard.holdSeconds')}</Text>
        <Pressable style={[styles.holdBtn, isHolding && styles.holdBtnActive]} onPress={onToggleHold}>
          <Text style={styles.holdBtnText}>
            {isHolding ? t('client.isometricWizard.pauseHold') : t('client.isometricWizard.startHold')}
          </Text>
        </Pressable>
      </View>
      <View style={styles.inputs}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('client.label.kg')}</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType={KEYBOARD_DECIMAL}
            placeholder={PLACEHOLDER_DASH}
            placeholderTextColor={PLACEHOLDER_COLOR}
          />
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
        <Text style={styles.ctaText}>{t('client.isometricWizard.registerSet')}</Text>
      </Pressable>
    </>
  );
}

function IsometricRestPhase({ restSeconds, onComplete }: { restSeconds: number; onComplete: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.isometricWizard.rest')}</Text>
      <IntervalTimer
        seconds={restSeconds}
        startLabel={t('client.isometricWizard.startTimer')}
        pauseLabel={t('client.isometricWizard.pauseTimer')}
        resetLabel={t('client.isometricWizard.resetTimer')}
        runningLabel={t('client.isometricWizard.timerRunning')}
        onComplete={onComplete}
      />
      <Pressable style={[styles.ctaButton, styles.ctaSecondary]} onPress={onComplete}>
        <Text style={styles.ctaText}>{t('client.isometricWizard.skipRest')}</Text>
      </Pressable>
    </>
  );
}

export function IsometricBlockOverlay({ item, onClose, onLogSet }: IsometricBlockOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const setsPlanned = item.setsPlanned ?? 1;
  const currentSet = item.logs.length + 1;
  const isFinished = item.logs.length >= setsPlanned;

  const [phase, setPhase] = useState<Phase>(isFinished ? 'done' : 'hold');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isHolding) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHolding]);

  const handleRestComplete = useCallback(() => {
    setPhase('hold');
    setElapsedSeconds(0);
    setWeight('');
    setRpe('');
  }, []);

  const handleRegister = useCallback(() => {
    setIsHolding(false);
    onLogSet({
      durationSecondsDone: elapsedSeconds > 0 ? elapsedSeconds : null,
      effortRpe: rpe ? Number(rpe) : null,
      sessionIsometricBlockId: item.id,
      setIndex: currentSet,
      weightDoneKg: weight ? Number(weight) : null,
    });
    const isLast = currentSet >= setsPlanned;
    if (isLast) {
      setPhase('done');
    } else if (item.restSeconds != null && item.restSeconds > 0) {
      setPhase('rest');
    } else {
      setElapsedSeconds(0);
      setWeight('');
      setRpe('');
    }
  }, [currentSet, elapsedSeconds, item.id, item.restSeconds, onLogSet, rpe, setsPlanned, weight]);

  return (
    <Modal animationType={MODAL_ANIMATION} visible onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('client.isometricWizard.back')}</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {item.displayName}
          </Text>
          <Text style={styles.progress}>
            {t('client.isometricWizard.set', { current: Math.min(currentSet, setsPlanned), total: setsPlanned })}
          </Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {phase === 'hold' && !isFinished && (
            <IsometricHoldPhase
              elapsedSeconds={elapsedSeconds}
              isHolding={isHolding}
              weight={weight}
              rpe={rpe}
              setWeight={setWeight}
              setRpe={setRpe}
              onToggleHold={() => setIsHolding((v) => !v)}
              onRegister={handleRegister}
            />
          )}
          {phase === 'rest' && item.restSeconds != null && item.restSeconds > 0 && (
            <IsometricRestPhase restSeconds={item.restSeconds} onComplete={handleRestComplete} />
          )}
          {(phase === 'done' || isFinished) && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneText}>{t('client.isometricWizard.finishBlock')}</Text>
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
  chronoCard: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    gap: 8,
    padding: 20,
  },
  chronoLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  chronoTime: {
    color: '#f1f5f9',
    fontSize: 48,
    fontWeight: '800',
  },
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
  holdBtn: {
    alignItems: 'center',
    backgroundColor: '#225fdb',
    borderRadius: 50,
    height: 80,
    justifyContent: 'center',
    marginTop: 8,
    width: 80,
  },
  holdBtnActive: {
    backgroundColor: '#dc2626',
  },
  holdBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
