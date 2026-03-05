import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
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
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onClose}
      transparent
      visible={props.visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.t('coach.clientProfile.note.title')}</Text>
          <Text style={styles.subtitle}>{props.t('coach.clientProfile.note.subtitle')}</Text>
          <TextInput
            multiline
            onChangeText={props.onChange}
            placeholder={props.t('coach.clientProfile.note.placeholder')}
            style={styles.input}
            value={props.draft}
          />
          <ModalActions canDelete={canDelete} {...props} />
        </View>
      </View>
    </Modal>
  );
}

const MODAL_ANIMATION = 'fade' as const;

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
    <View style={styles.actions}>
      <Pressable onPress={props.onClose} style={[styles.btn, styles.btnCancel]}>
        <Text style={styles.textCancel}>{props.t('coach.clientProfile.edit.cancel')}</Text>
      </Pressable>
      <Pressable
        disabled={isDeleteDisabled}
        onPress={props.onDelete}
        style={[styles.btn, styles.btnDelete, isDeleteDisabled && styles.btnDisabled]}
      >
        <Text style={styles.textDelete}>{props.t('coach.clientProfile.note.delete')}</Text>
      </Pressable>
      <Pressable
        disabled={props.isSaving}
        onPress={props.onSave}
        style={[styles.btn, styles.btnSave, props.isSaving && styles.btnDisabled]}
      >
        <Text style={styles.textSave}>{props.t('coach.clientProfile.note.save')}</Text>
      </Pressable>
    </View>
  );
}
