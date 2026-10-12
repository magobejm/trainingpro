import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  cancelLabel: string;
  mediaContent?: React.ReactNode;
  formContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  children?: React.ReactNode; // For backwards compatibility
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  subtitle?: string; // Backwards compat
  visible: boolean;
};

export function LibraryCreateModal(props: Props): React.JSX.Element {
  const isTwoColumn = Boolean(props.mediaContent && props.formContent);
  return (
    <Modal
      closeLabel={props.cancelLabel}
      footer={<ModalActions {...props} />}
      onClose={props.onClose}
      size={isTwoColumn ? 'xl' : 'md'}
      title={props.title}
      visible={props.visible}
    >
      {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
      {isTwoColumn ? (
        <View style={styles.columns}>
          <View style={styles.mediaColumn}>{props.mediaContent}</View>
          <View style={styles.formColumn}>
            {props.formContent}
            {props.errorContent}
          </View>
        </View>
      ) : (
        <View style={styles.formColumn}>{props.children}</View>
      )}
    </Modal>
  );
}

function ModalActions(props: Props): React.JSX.Element {
  return (
    <>
      <Button label={props.cancelLabel} onPress={props.onClose} variant="secondary" />
      <Button
        label={props.isSubmitting ? props.submittingLabel : props.submitLabel}
        loading={props.isSubmitting}
        onPress={props.onSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xl,
  },
  formColumn: {
    flex: 1,
    gap: space.lg,
    minWidth: 280,
  },
  mediaColumn: {
    backgroundColor: colors.surfaceMuted,
    flex: 1,
    gap: space.lg,
    minWidth: 280,
    padding: space.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.md,
  },
});
