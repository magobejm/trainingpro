import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Modal, TextField, colors, fontSize } from '@trainerpro/ui';

type Translate = (key: string) => string;

/** A free-text note: editable by the coach while the day is open, plain text afterwards. */
export function ItemNoteModal(props: {
  editable: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  t: Translate;
  title: string;
  value: string;
  visible: boolean;
}): React.JSX.Element | null {
  const [draft, setDraft] = useState(props.value);
  useEffect(() => {
    if (props.visible) setDraft(props.value);
  }, [props.visible, props.value]);
  if (!props.visible) return null;
  const save = () => {
    props.onSave(draft.trim());
    props.onClose();
  };
  return (
    <Modal
      closeLabel={props.t('common.close')}
      dismissOnOverlay
      footer={
        props.editable ? (
          <>
            <Button label={props.t('common.cancel')} onPress={props.onClose} variant="secondary" />
            <Button label={props.t('common.save')} onPress={save} />
          </>
        ) : (
          <Button label={props.t('common.close')} onPress={props.onClose} variant="secondary" />
        )
      }
      onClose={props.onClose}
      title={props.title}
      visible
    >
      {props.editable ? (
        <TextField
          multiline
          numberOfLines={5}
          onChangeText={setDraft}
          placeholder={props.t('coach.clientRoutine.note.placeholder')}
          value={draft}
        />
      ) : (
        <Text style={styles.text}>{props.value || props.t('coach.clientRoutine.note.empty')}</Text>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({ text: { color: colors.text, fontSize: fontSize.sm, lineHeight: 22 } });
