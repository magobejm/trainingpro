import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { glossaryEntry, glossaryLocale, type SetVariableKey } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';
import type { SetFieldKey } from './active-exercise.helpers';

const GLOSSARY_ID: Record<SetFieldKey, SetVariableKey> = {
  distance: 'distanceMeters',
  duration: 'durationSeconds',
  fcMaxPct: 'fcMaxPct',
  fcReservePct: 'fcReservePct',
  heartRate: 'heartRate',
  reps: 'reps',
  rest: 'restSeconds',
  rir: 'rir',
  rom: 'rom',
  rpe: 'rpe',
  weight: 'weightKg',
};

/** Same sheet as the exercise-order explanation: dark backdrop, white card, one close button. */
export function SetVariableHint(props: { field: SetFieldKey; label: string }): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const entry = glossaryEntry(glossaryLocale(i18n.language), GLOSSARY_ID[props.field]);
  const close = (): void => setOpen(false);
  return (
    <>
      <Pressable accessibilityRole={'button'} onPress={() => setOpen(true)}>
        <Text style={styles.label}>{props.label}</Text>
      </Pressable>
      <Modal animationType={'fade'} onRequestClose={close} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable accessibilityRole={'button'} onPress={close} style={styles.backdropTap} />
          <View style={styles.sheet}>
            <Text style={styles.title}>{entry?.term}</Text>
            <Text style={styles.message}>{entry?.short}</Text>
            <Pressable accessibilityRole={'button'} onPress={close} style={styles.close}>
              <Text style={styles.closeText}>{t('mobile.client.session.orderInfoClose')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  backdropTap: {
    backgroundColor: LIGHT.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  close: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginTop: 8,
    paddingVertical: 12,
  },
  closeText: { color: LIGHT.textOnNavy, fontSize: 15, fontWeight: '700' },
  label: {
    color: LIGHT.accentMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  message: { color: LIGHT.accentDark, fontSize: 15, lineHeight: 22 },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    gap: 12,
    maxWidth: 420,
    padding: 24,
    width: '100%',
    zIndex: 1,
  },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
});
