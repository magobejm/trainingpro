import React from 'react';
import { Text } from 'react-native';
import { Button, Modal, TextField } from '@trainerpro/ui';
import { styles } from './ClientProfileNoteModal.styles';

type Props = {
  draft: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  t: (key: string) => string;
  visible: boolean;
};

export function ClientProfileNoteModal(props: Props): React.JSX.Element {
  const canDelete = canDeleteNote(props.draft);
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<ModalActions canDelete={canDelete} {...props} />}
      onClose={props.onClose}
      size="md"
      title={props.t('coach.clientProfile.note.title')}
      visible={props.visible}
    >
      <Text style={styles.subtitle}>{props.t('coach.clientProfile.note.subtitle')}</Text>
      <TextField
        accessibilityLabel={props.t('coach.clientProfile.note.title')}
        multiline
        onChangeText={props.onChange}
        placeholder={props.t('coach.clientProfile.note.placeholder')}
        value={props.draft}
      />
    </Modal>
  );
}

function canDeleteNote(draft: string): boolean {
  return draft.trim().length > 0;
}

function ModalActions(
  props: Pick<Props, 'isSaving' | 'onClose' | 'onDelete' | 'onSave' | 't'> & {
    canDelete: boolean;
  },
): React.JSX.Element {
  const isDeleteDisabled = !props.canDelete || props.isSaving;
  return (
    <>
      <Button label={props.t('coach.clientProfile.edit.cancel')} onPress={props.onClose} variant="secondary" />
      <Button
        disabled={isDeleteDisabled}
        label={props.t('coach.clientProfile.note.delete')}
        onPress={props.onDelete}
        variant="danger"
      />
      <Button loading={props.isSaving} label={props.t('coach.clientProfile.note.save')} onPress={props.onSave} />
    </>
  );
}
