import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, useDialogFocus, useReducedMotion } from '@trainerpro/ui';

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
  const reduced = useReducedMotion();
  const [entered, setEntered] = useState(false);
  useDialogFocus(props.visible, panelRef);
  useEffect(() => {
    if (!props.visible) {
      setEntered(false);
      return undefined;
    }
    let alive = true;
    const reveal = (): void => {
      if (alive) setEntered(true);
    };
    const frame = requestAnimationFrame(reveal);
    const timer = setTimeout(reveal, 50);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [props.visible]);
  const revealed = reduced || entered;
  return (
    <Modal animationType={reduced ? FADE : 'none'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={[styles.overlay, styles.motion, { opacity: revealed ? 1 : 0 }]}>
        <View
          ref={panelRef}
          role={DIALOG}
          style={[styles.panel, styles.motion, { transform: [{ translateX: revealed ? 0 : -DRAWER_WIDTH }] }]}
        >
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
  motion: {
    // @ts-expect-error web-only
    transitionDuration: '200ms',
    transitionProperty: 'opacity, transform',
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    height: '100%',
    maxWidth: '85%',
    overflow: 'hidden',
    width: DRAWER_WIDTH,
  },
});
