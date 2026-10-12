import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import type { HandoffChoice } from './routine-handoff';
import { Button, Modal, colors, fontSize } from '@trainerpro/ui';

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
    <Modal
      closeLabel={props.t('common.close')}
      footer={
        <>
          <Button label={props.t('common.cancel')} onPress={props.onCancel} variant="secondary" />
          <Button label={props.t('coach.routine.handoff.replace')} onPress={props.onReplace} variant="danger" />
          <Button label={props.t('coach.routine.handoff.continue')} onPress={props.onContinue} />
        </>
      }
      onClose={props.onCancel}
      size="sm"
      title={props.t('coach.routine.handoff.title')}
      visible={props.visible}
    >
      <Text style={styles.message}>{props.t('coach.routine.handoff.message')}</Text>
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
  message: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
};
