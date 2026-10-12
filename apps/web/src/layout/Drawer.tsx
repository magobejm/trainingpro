import React, { useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, useDialogFocus } from '@trainerpro/ui';

const DRAWER_WIDTH = 290;
const FADE = 'fade' as const;
const DIALOG = 'dialog' as const;

/** Panel lateral que se abre sobre el contenido en móvil (menú ☰). Esc o pulsar fuera lo cierra. */
export function Drawer(props: {
  children: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
  visible: boolean;
}): React.JSX.Element {
  const panelRef = useRef<View>(null);
  useDialogFocus(props.visible, panelRef);
  return (
    <Modal animationType={FADE} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View ref={panelRef} role={DIALOG} style={styles.panel}>
          {props.children}
        </View>
        <Pressable
          accessibilityLabel={props.closeLabel}
          accessibilityRole="button"
          onPress={props.onClose}
          style={styles.backdrop}
          tabIndex={-1}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    maxWidth: '85%',
    width: DRAWER_WIDTH,
  },
});
