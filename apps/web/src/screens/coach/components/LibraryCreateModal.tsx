import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const MODAL_ANIMATION = 'fade' as const;

type Props = {
  cancelLabel: string;
  children: React.ReactNode;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submittingLabel: string;
  subtitle: string;
  title: string;
  visible: boolean;
};

export function LibraryCreateModal(props: Props): React.JSX.Element {
  return (
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onClose}
      transparent
      visible={props.visible}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.subtitle}>{props.subtitle}</Text>
          <View style={styles.form}>{props.children}</View>
          <View style={styles.actions}>
            <Pressable onPress={props.onClose} style={styles.cancelButton}>
              <Text style={styles.cancelLabel}>{props.cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={props.onSubmit} style={styles.submitButton}>
              <Text style={styles.submitLabel}>
                {props.isSubmitting ? props.submittingLabel : props.submitLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#eff4ff',
    borderColor: '#d4e2f5',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  cancelLabel: {
    color: '#2f4f7d',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e3f2',
    borderRadius: 16,
    borderWidth: 1,
    gap: 9,
    maxWidth: 450,
    padding: 18,
    width: '100%',
  },
  form: {
    gap: 8,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(9, 16, 28, 0.4)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  submitLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    color: '#627285',
    fontSize: 13,
    marginBottom: 4,
  },
  title: {
    color: '#111418',
    fontSize: 21,
    fontWeight: '800',
  },
});
