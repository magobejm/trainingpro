import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import {
  canSubmitMorningCheckin,
  MOTIVATION_OPTIONS,
  RECOVERY_OPTIONS,
  SLEEP_OPTIONS,
  type MorningScaleOption,
} from './daily-checkin.utils';

type Props = {
  isSubmitting: boolean;
  visible: boolean;
  onSkip: () => void;
  onSubmit: (scores: { motivation: number; recovery: number; sleep: number }) => void;
};

export function MorningCheckinModal(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [sleep, setSleep] = useState<null | number>(null);
  const [motivation, setMotivation] = useState<null | number>(null);
  const [recovery, setRecovery] = useState<null | number>(null);

  useEffect(() => {
    if (props.visible) {
      setSleep(null);
      setMotivation(null);
      setRecovery(null);
    }
  }, [props.visible]);

  const canSave = canSubmitMorningCheckin({ motivation, recovery, sleep }) && !props.isSubmitting;

  return (
    <Modal animationType={'fade'} onRequestClose={props.onSkip} transparent visible={props.visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{'🌅'}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('mobile.client.checkin.title')}</Text>
              <Text style={styles.subtitle}>{t('mobile.client.checkin.subtitle')}</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <ScaleCard
              label={t('mobile.client.checkin.sleepQuestion')}
              onSelect={setSleep}
              options={SLEEP_OPTIONS}
              value={sleep}
            />
            <ScaleCard
              label={t('mobile.client.checkin.motivationQuestion')}
              onSelect={setMotivation}
              options={MOTIVATION_OPTIONS}
              value={motivation}
            />
            <ScaleCard
              label={t('mobile.client.checkin.recoveryQuestion')}
              onSelect={setRecovery}
              options={RECOVERY_OPTIONS}
              value={recovery}
            />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable disabled={props.isSubmitting} onPress={props.onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t('mobile.client.checkin.skip')}</Text>
            </Pressable>
            <Pressable
              disabled={!canSave}
              onPress={() => {
                if (sleep == null || motivation == null || recovery == null) {
                  return;
                }
                props.onSubmit({ motivation, recovery, sleep });
              }}
              style={[styles.saveBtn, !canSave ? styles.saveBtnDisabled : null]}
            >
              <Text style={styles.saveText}>{t('mobile.client.checkin.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ScaleCard(props: {
  label: string;
  onSelect: (value: number) => void;
  options: MorningScaleOption[];
  value: null | number;
}): React.JSX.Element {
  const { t } = useTranslation();
  const selected = props.options.find((option) => option.value === props.value);

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{props.label}</Text>
      <View style={styles.scaleRow}>
        {props.options.map((option) => {
          const selectedOption = option.value === props.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => props.onSelect(option.value)}
              style={[styles.option, selectedOption ? styles.optionSelected : null]}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[styles.optionValue, selectedOption ? styles.optionValueSelected : null]}>{option.value}</Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? <Text style={styles.selectedLabel}>{`${selected.value}/5: ${t(selected.labelKey)}`}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#eff6ff99',
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 16 },
  headerText: { flex: 1 },
  icon: { fontSize: 18 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: LIGHT.radiusLg,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  option: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingVertical: 8,
  },
  optionEmoji: { fontSize: 20 },
  optionSelected: {
    backgroundColor: LIGHT.accent,
    borderColor: LIGHT.accentMuted,
    transform: [{ scale: 1.04 }],
  },
  optionValue: { color: LIGHT.text, fontSize: 10, fontWeight: '800' },
  optionValueSelected: { color: LIGHT.textOnNavy },
  question: { color: LIGHT.textStrong, fontSize: 12, fontWeight: '800' },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusLg,
    flex: 1.4,
    paddingVertical: 14,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '800' },
  scaleRow: { flexDirection: 'row', gap: 6 },
  scroll: { gap: 12, paddingBottom: 8 },
  selectedLabel: { color: LIGHT.accentDark, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 32,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 24,
    width: '100%',
  },
  skipBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusLg,
    flex: 1,
    paddingVertical: 14,
  },
  skipText: { color: LIGHT.accent, fontSize: 14, fontWeight: '800' },
  subtitle: { color: LIGHT.accent, fontSize: 12, fontWeight: '600' },
  title: { color: LIGHT.textStrong, fontSize: 17, fontWeight: '800' },
});
