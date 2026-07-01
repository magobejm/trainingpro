import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

const MODAL_ANIMATION = 'slide';

type StartModeModalProps = {
  visible: boolean;
  onSelect: (mode: 'INTERACTIVE' | 'TIMER') => void;
  onCancel: () => void;
};

export function StartModeModal({ visible, onSelect, onCancel }: StartModeModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType={MODAL_ANIMATION} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('client.start.title')}</Text>
          <Pressable style={[styles.btn, styles.btnInteractive]} onPress={() => onSelect('INTERACTIVE')}>
            <Text style={styles.btnText}>{t('client.start.modeInteractive')}</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnTimer]} onPress={() => onSelect('TIMER')}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>{t('client.start.modeTimer')}</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t('client.start.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderTopLeftRadius: LIGHT.radius2xl,
    borderTopRightRadius: LIGHT.radius2xl,
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  btn: {
    borderRadius: LIGHT.radiusMd,
    paddingVertical: 16,
  },
  btnInteractive: {
    backgroundColor: LIGHT.accent,
  },
  btnTimer: {
    backgroundColor: LIGHT.accentSoft,
  },
  btnText: {
    color: LIGHT.textOnNavy,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnTextSecondary: {
    color: LIGHT.accentDark,
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    color: LIGHT.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
