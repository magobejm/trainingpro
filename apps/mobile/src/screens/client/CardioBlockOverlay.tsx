import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IntervalTimer } from '../../features/timers/IntervalTimer';
import type { CardioSessionItem, LogIntervalMutationInput } from '../../data/hooks/useTodaySession';

type Phase = 'work' | 'rest' | 'done';

type CardioBlockOverlayProps = {
  item: CardioSessionItem;
  sessionId: string;
  onClose: () => void;
  onLogInterval: (input: LogIntervalMutationInput) => void;
};

const MODAL_ANIMATION = 'slide';
const KEYBOARD_DECIMAL = 'decimal-pad';
const KEYBOARD_NUMBER = 'number-pad';
const PLACEHOLDER_COLOR = '#475569';
const PLACEHOLDER_DASH = '--';

type WorkPhaseProps = {
  item: CardioSessionItem;
  duration: string;
  distance: string;
  rpe: string;
  heartRate: string;
  setDuration: (v: string) => void;
  setDistance: (v: string) => void;
  setRpe: (v: string) => void;
  setHeartRate: (v: string) => void;
  onRegister: () => void;
};

function CardioWorkPhase({
  item,
  duration,
  distance,
  rpe,
  heartRate,
  setDuration,
  setDistance,
  setRpe,
  setHeartRate,
  onRegister,
}: WorkPhaseProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.cardioWizard.work')}</Text>
      <IntervalTimer
        seconds={item.workSeconds}
        startLabel={t('client.cardioWizard.startTimer')}
        pauseLabel={t('client.cardioWizard.pauseTimer')}
        resetLabel={t('client.cardioWizard.resetTimer')}
        runningLabel={t('client.cardioWizard.timerRunning')}
      />
      <View style={styles.inputs}>
        <InputRow
          label={t('client.cardioWizard.duration')}
          value={duration}
          onChangeText={setDuration}
          keyboardType={KEYBOARD_NUMBER}
          placeholderColor={PLACEHOLDER_COLOR}
        />
        <InputRow
          label={t('client.cardioWizard.distance')}
          value={distance}
          onChangeText={setDistance}
          keyboardType={KEYBOARD_NUMBER}
          placeholderColor={PLACEHOLDER_COLOR}
        />
        <InputRow
          label={t('client.cardioWizard.rpe')}
          value={rpe}
          onChangeText={setRpe}
          keyboardType={KEYBOARD_NUMBER}
          placeholderColor={PLACEHOLDER_COLOR}
        />
        <InputRow
          label={t('client.cardioWizard.heartRate')}
          value={heartRate}
          onChangeText={setHeartRate}
          keyboardType={KEYBOARD_DECIMAL}
          placeholderColor={PLACEHOLDER_COLOR}
        />
      </View>
      <Pressable style={styles.ctaButton} onPress={onRegister}>
        <Text style={styles.ctaText}>{t('client.cardioWizard.registerInterval')}</Text>
      </Pressable>
    </>
  );
}

function CardioRestPhase({ restSeconds, onComplete }: { restSeconds: number; onComplete: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('client.cardioWizard.rest')}</Text>
      <IntervalTimer
        seconds={restSeconds}
        startLabel={t('client.cardioWizard.startTimer')}
        pauseLabel={t('client.cardioWizard.pauseTimer')}
        resetLabel={t('client.cardioWizard.resetTimer')}
        runningLabel={t('client.cardioWizard.timerRunning')}
        onComplete={onComplete}
      />
      <Pressable style={[styles.ctaButton, styles.ctaSecondary]} onPress={onComplete}>
        <Text style={styles.ctaText}>{t('client.cardioWizard.skipRest')}</Text>
      </Pressable>
    </>
  );
}

export function CardioBlockOverlay({ item, onClose, onLogInterval }: CardioBlockOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const currentInterval = item.intervalLogs.length + 1;
  const totalRounds = item.roundsPlanned;
  const isFinished = item.intervalLogs.length >= totalRounds;

  const [phase, setPhase] = useState<Phase>(isFinished ? 'done' : 'work');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [rpe, setRpe] = useState('');
  const [heartRate, setHeartRate] = useState('');

  const handleRestComplete = useCallback(() => {
    setPhase('work');
    setDuration('');
    setDistance('');
    setRpe('');
    setHeartRate('');
  }, []);

  const handleRegister = useCallback(() => {
    onLogInterval({
      sessionCardioBlockId: item.id,
      intervalIndex: currentInterval,
      durationSecondsDone: duration ? Number(duration) : null,
      distanceDoneMeters: distance ? Number(distance) : null,
      effortRpe: rpe ? Number(rpe) : null,
      avgHeartRate: heartRate ? Number(heartRate) : null,
    });
    const isLast = currentInterval >= totalRounds;
    if (isLast) {
      setPhase('done');
    } else if (item.restSeconds > 0) {
      setPhase('rest');
    } else {
      setDuration('');
      setDistance('');
      setRpe('');
      setHeartRate('');
    }
  }, [currentInterval, distance, duration, heartRate, item.id, item.restSeconds, onLogInterval, rpe, totalRounds]);

  return (
    <Modal animationType={MODAL_ANIMATION} visible onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('client.cardioWizard.back')}</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {item.displayName}
          </Text>
          <Text style={styles.progress}>
            {t('client.cardioWizard.interval', {
              current: Math.min(currentInterval, totalRounds),
              total: totalRounds,
            })}
          </Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {phase === 'work' && !isFinished && (
            <CardioWorkPhase
              item={item}
              duration={duration}
              distance={distance}
              rpe={rpe}
              heartRate={heartRate}
              setDuration={setDuration}
              setDistance={setDistance}
              setRpe={setRpe}
              setHeartRate={setHeartRate}
              onRegister={handleRegister}
            />
          )}
          {phase === 'rest' && item.restSeconds > 0 && (
            <CardioRestPhase restSeconds={item.restSeconds} onComplete={handleRestComplete} />
          )}
          {(phase === 'done' || isFinished) && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneText}>{t('client.cardioWizard.finishBlock')}</Text>
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
