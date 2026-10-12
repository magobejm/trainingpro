import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  cancelLabel: string;
  confirmLabel?: string;
  errorMessage?: string | null;
  isLoading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm?: () => void;
  title: string;
  visible: boolean;
};

export function ActionConfirmModal(props: Props): React.JSX.Element {
  return (
    <Modal
      closeLabel={props.cancelLabel}
      footer={<ActionButtons {...props} />}
      onClose={props.onCancel}
      size="sm"
      title={props.title}
      visible={props.visible}
    >
      <Text style={styles.message}>{props.message}</Text>
      {props.errorMessage ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{props.errorMessage}</Text>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: space.md,
    padding: space.md,
  },
  bannerText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});

function ActionButtons(
  props: Pick<Props, 'cancelLabel' | 'confirmLabel' | 'isLoading' | 'onCancel' | 'onConfirm'>,
): React.JSX.Element {
  return (
    <>
      <Button disabled={props.isLoading} label={props.cancelLabel} onPress={props.onCancel} variant="secondary" />
      {props.confirmLabel && props.onConfirm ? (
        <Button label={props.confirmLabel} loading={props.isLoading} onPress={props.onConfirm} variant="danger" />
      ) : null}
    </>
  );
}
