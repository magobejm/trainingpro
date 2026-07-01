import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LogSportMutationInput, SportSessionItem } from '../../data/hooks/useTodaySession';
import { LIGHT } from '../../theme/light';

const MODAL_ANIMATION = 'slide';
const KEYBOARD_NUMBER = 'number-pad';
const PLACEHOLDER_COLOR = LIGHT.textMuted;
const PLACEHOLDER_DASH = '--';

type SportBlockOverlayProps = {
  item: SportSessionItem;
  sessionId: string;
  onClose: () => void;
  onLog: (input: LogSportMutationInput) => void;
};

export function SportBlockOverlay({ item, onClose, onLog }: SportBlockOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const alreadyLogged = item.log != null;

  const [minutes, setMinutes] = useState(
    alreadyLogged ? String(item.log?.durationMinutesDone ?? '') : String(item.durationMinutes),
  );
  const [rpe, setRpe] = useState(alreadyLogged ? String(item.log?.effortRpe ?? '') : '');
  const [hr, setHr] = useState(alreadyLogged ? String(item.log?.avgHeartRate ?? '') : '');
  const [saved, setSaved] = useState(alreadyLogged);

  const handleRegister = useCallback(() => {
    onLog({
      avgHeartRate: hr ? Number(hr) : null,
      durationMinutesDone: minutes ? Number(minutes) : null,
      effortRpe: rpe ? Number(rpe) : null,
      sessionSportBlockId: item.id,
    });
    setSaved(true);
  }, [hr, item.id, minutes, onLog, rpe]);

  return (
    <Modal animationType={MODAL_ANIMATION} visible onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('client.sportWizard.back')}</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {item.displayName}
          </Text>
          <Text style={styles.subtitle}>{t('client.sportWizard.target', { minutes: item.durationMinutes })}</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {saved ? (
            <View style={styles.doneContainer}>
              <Text style={styles.doneText}>{t('client.sportWizard.saved')}</Text>
              <Pressable style={styles.ctaButton} onPress={onClose}>
                <Text style={styles.ctaText}>{t('client.wizard.close')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <InputRow
                label={t('client.sportWizard.durationMinutes')}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType={KEYBOARD_NUMBER}
                placeholderColor={PLACEHOLDER_COLOR}
              />
              <InputRow
                label={t('client.label.rpe')}
                value={rpe}
                onChangeText={setRpe}
                keyboardType={KEYBOARD_NUMBER}
                placeholderColor={PLACEHOLDER_COLOR}
              />
              <InputRow
                label={t('client.sportWizard.avgHeartRate')}
                value={hr}
                onChangeText={setHr}
                keyboardType={KEYBOARD_NUMBER}
                placeholderColor={PLACEHOLDER_COLOR}
              />
              <Pressable style={styles.ctaButton} onPress={handleRegister}>
                <Text style={styles.ctaText}>{t('client.sportWizard.registerSession')}</Text>
              </Pressable>
            </>
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
  keyboardType: 'number-pad';
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
    paddingVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    color: LIGHT.textMuted,
    fontSize: 13,
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 20,
    fontWeight: '700',
  },
});
