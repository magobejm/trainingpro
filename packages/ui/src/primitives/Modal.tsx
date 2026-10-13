import React, { useEffect, useRef, useState } from 'react';
import { Modal as NativeModal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../theme/motion';
import { colors, fontSize, radius, shadow, space } from '../theme/tokens';
import { IconButton } from './IconButton';
import { MODAL_WIDTHS, type ModalSize } from './modal.logic';
import { useDialogFocus } from './useDialogFocus';

const CLOSE_GLYPH = '✕';

export type ModalProps = {
  children: React.ReactNode;
  /** Etiqueta accesible de la ✕ de la esquina (traducida por quien llama). */
  closeLabel: string;
  /** Cierra al pulsar fuera de la ventana. Por defecto no, para no perder datos de un formulario. */
  dismissOnOverlay?: boolean;
  footer?: React.ReactNode;
  /** Se llama con Esc, con la ✕ y, si se activa, al pulsar fuera. */
  onClose: () => void;
  scroll?: boolean;
  size?: ModalSize;
  title?: string;
  visible: boolean;
};

export function Modal(props: ModalProps): React.JSX.Element {
  const cardRef = useRef<View>(null);
  useDialogFocus(props.visible, cardRef);
  const reduced = useReducedMotion();
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!props.visible) {
      setEntered(false);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [props.visible]);
  const { scroll = true, size = 'md' } = props;
  const revealed = reduced || entered;
  const Body = scroll ? ScrollView : View;
  return (
    <NativeModal animationType={reduced ? 'none' : 'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        {props.dismissOnOverlay ? (
          <Pressable
            accessibilityLabel={props.closeLabel}
            accessibilityRole="button"
            onPress={props.onClose}
            style={StyleSheet.absoluteFill}
            tabIndex={-1}
          />
        ) : null}
        <View
          accessibilityViewIsModal
          aria-modal
          ref={cardRef}
          role="dialog"
          style={[
            styles.card,
            styles.enter,
            { maxWidth: MODAL_WIDTHS[size], opacity: revealed ? 1 : 0, transform: [{ scale: revealed ? 1 : 0.98 }] },
          ]}
        >
          <View style={styles.header}>
            <Text numberOfLines={2} style={styles.title}>
              {props.title ?? ''}
            </Text>
            <IconButton
              accessibilityLabel={props.closeLabel}
              icon={(color) => <Text style={[styles.closeGlyph, { color }]}>{CLOSE_GLYPH}</Text>}
              onPress={props.onClose}
              size={32}
            />
          </View>
          <Body style={styles.body}>{props.children}</Body>
          {props.footer ? <View style={styles.footer}>{props.footer}</View> : null}
        </View>
      </View>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '90%',
    width: '100%',
    ...shadow.lg,
  },
  enter: {
    // @ts-expect-error web-only
    transitionDuration: '150ms',
    transitionProperty: 'opacity, transform',
  },
  closeGlyph: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: space.sm,
    justifyContent: 'flex-end',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.md,
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
