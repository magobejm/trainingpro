import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LIGHT } from './light';

type ConfirmModalProps = {
  cancelLabel: string;
  confirmLabel: string;
  message: string;
  title: string;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal(props: ConfirmModalProps): React.JSX.Element {
  return (
    <Modal visible={props.visible} transparent animationType={'fade'} onRequestClose={props.onCancel}>
      <Pressable style={styles.backdrop} onPress={props.onCancel}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.message}>{props.message}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={props.onCancel}>
              <Text style={styles.cancelText}>{props.cancelLabel}</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={props.onConfirm}>
              <Text style={styles.confirmText}>{props.confirmLabel}</Text>
            </Pressable>
          </View>
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
    maxWidth: 420,
    padding: 24,
    width: '100%',
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    color: LIGHT.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  cancelText: {
    color: LIGHT.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  confirmText: {
    color: LIGHT.textOnNavy,
    fontSize: 14,
    fontWeight: '700',
  },
});
