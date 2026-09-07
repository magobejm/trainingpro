import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';

type ExerciseInstructionsModalProps = {
  emptyKey?: string;
  instructions: null | string;
  title: string;
  visible: boolean;
  onClose: () => void;
};

export function ExerciseInstructionsModal({
  emptyKey = 'mobile.client.exercise.instructionsEmpty',
  instructions,
  title,
  visible,
  onClose,
}: ExerciseInstructionsModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const text = instructions?.trim() ?? '';

  return (
    <Modal visible={visible} transparent animationType={'fade'} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {text ? (
            <ScrollView style={styles.scroll}>
              <Text style={styles.body}>{text}</Text>
            </ScrollView>
          ) : (
            <Text style={styles.empty}>{t(emptyKey)}</Text>
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('client.wizard.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    gap: 12,
    maxHeight: '80%',
    padding: 24,
    width: '100%',
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    maxHeight: 320,
  },
  body: {
    color: LIGHT.text,
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    color: LIGHT.textMuted,
    fontSize: 14,
  },
  closeBtn: SESSION.secondaryBtn,
  closeBtnText: SESSION.secondaryBtnText,
});
