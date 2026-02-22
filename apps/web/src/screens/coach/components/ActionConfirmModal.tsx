import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from './ActionConfirmModal.styles';

const MODAL_ANIMATION = 'fade' as const;

type Props = {
  cancelLabel: string;
  confirmLabel: string;
  isLoading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ActionConfirmModal(props: Props): React.JSX.Element {
  return (
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onCancel}
      transparent
      visible={props.visible}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.message}>{props.message}</Text>
          <View style={styles.actions}>
            <Pressable
              disabled={props.isLoading}
              onPress={props.onCancel}
              style={[styles.cancelButton, props.isLoading && { opacity: 0.5 }]}
            >
              <Text style={styles.cancelLabel}>{props.cancelLabel}</Text>
            </Pressable>
            <Pressable
              disabled={props.isLoading}
              onPress={props.onConfirm}
              style={[styles.confirmButton, props.isLoading && { opacity: 0.5 }]}
            >
              <Text style={styles.confirmLabel}>
                {props.isLoading ? '...' : props.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
