import React, { useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { HandoffChoice } from './routine-handoff';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIMATION = 'fade' as const;

type Translate = (key: string) => string;

type DialogProps = {
  onCancel: () => void;
  onContinue: () => void;
  onReplace: () => void;
  t: Translate;
  visible: boolean;
};

export function RoutineHandoffDialog(props: DialogProps): React.JSX.Element {
  return (
    <Modal animationType={MODAL_ANIMATION} onRequestClose={props.onCancel} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.t('coach.routine.handoff.title')}</Text>
          <Text style={styles.message}>{props.t('coach.routine.handoff.message')}</Text>
          <Pressable onPress={props.onContinue} style={styles.continueButton}>
            <Text style={styles.continueLabel}>{props.t('coach.routine.handoff.continue')}</Text>
          </Pressable>
          <Pressable onPress={props.onReplace} style={styles.replaceButton}>
            <Text style={styles.replaceLabel}>{props.t('coach.routine.handoff.replace')}</Text>
          </Pressable>
          <Pressable onPress={props.onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelLabel}>{props.t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function useRoutineHandoffPrompt(t: Translate): {
  ask: () => Promise<HandoffChoice>;
  dialog: React.JSX.Element;
} {
  const [visible, setVisible] = useState(false);
  const resolver = useRef<((choice: HandoffChoice) => void) | null>(null);

  function ask(): Promise<HandoffChoice> {
    setVisible(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }

  function choose(choice: HandoffChoice) {
    setVisible(false);
    resolver.current?.(choice);
    resolver.current = null;
  }

  return {
    ask,
    dialog: (
      <RoutineHandoffDialog
        onCancel={() => choose('cancel')}
        onContinue={() => choose('continue')}
        onReplace={() => choose('replace')}
        t={t}
        visible={visible}
      />
    ),
  };
}

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: space.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: space.md,
    maxWidth: 440,
    padding: space.lg,
    width: '100%' as const,
  },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' as const },
  message: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  continueLabel: { color: colors.surface, fontSize: fontSize.sm, fontWeight: '700' as const, textAlign: 'center' as const },
  replaceButton: {
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  replaceLabel: { color: colors.surface, fontSize: fontSize.sm, fontWeight: '700' as const, textAlign: 'center' as const },
  cancelButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  cancelLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' as const, textAlign: 'center' as const },
};
