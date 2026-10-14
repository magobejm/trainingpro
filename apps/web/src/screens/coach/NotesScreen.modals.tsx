import { getLayoutStyle1, getLayoutStyle2 } from './NotesScreen.modals.layout-styles';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Check } from 'lucide-react';
import type { NoteData } from './notes-screen.types';
import { formatNoteDate } from './notes-screen.utils';
import { Button, Modal, TextField, colors as tk, fontSize, radius, space } from '@trainerpro/ui';
const MODAL_SIZE = 'md' as const;
const MODAL_SIZE_SM = 'sm' as const;
const VARIANT_SECONDARY = 'secondary' as const;
const VARIANT_DANGER = 'danger' as const;
const EDITOR_LINES = 10;
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
export type EditNoteModalProps = {
  editingNote: NoteData | null;
  editContent: string;
  setEditContent: (v: string) => void;
  onClose: () => void;
  isSaving?: boolean;
  onSave: () => void;
  t: TFunc;
};
export function EditNoteModal(props: EditNoteModalProps): React.JSX.Element {
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<EditNoteModalFooter isSaving={props.isSaving} onClose={props.onClose} onSave={props.onSave} t={props.t} />}
      onClose={props.onClose}
      size={MODAL_SIZE}
      title={props.t('coach.notes.edit.title')}
      visible={Boolean(props.editingNote)}
    >
      <EditNoteModalBody
        editContent={props.editContent}
        editingNote={props.editingNote}
        setEditContent={props.setEditContent}
        t={props.t}
      />
    </Modal>
  );
}
function EditNoteModalBody(props: {
  editContent: string;
  editingNote: NoteData | null;
  setEditContent: (v: string) => void;
  t: TFunc;
}): React.JSX.Element {
  return (
    <View>
      <EditNoteMetaBadge editingNote={props.editingNote} t={props.t} />
      <TextField
        accessibilityLabel={props.t('coach.notes.edit.title')}
        multiline
        numberOfLines={EDITOR_LINES}
        onChangeText={props.setEditContent}
        value={props.editContent}
      />
    </View>
  );
}
function EditNoteMetaBadge(props: { editingNote: NoteData | null; t: TFunc }): React.JSX.Element | null {
  const { i18n } = useTranslation();
  const note = props.editingNote;
  if (!note) {
    return null;
  }
  const layoutStyle1 = getLayoutStyle1;
  return (
    <View style={noteBadgeRowStyle}>
      <View style={noteBadgeStyle(note.type)}>
        <Text style={noteBadgeTextStyle(note.type)} numberOfLines={2}>
          {readEditBadgeLabel(note, props.t)}
        </Text>
      </View>
      <Text style={layoutStyle1}>{formatNoteDate(note.createdAt, props.t, i18n.language)}</Text>
    </View>
  );
}
function readEditBadgeLabel(note: NoteData, t: TFunc): string {
  if (note.type === 'general') {
    return t('coach.notes.history.myNotes');
  }
  return t('coach.notes.type.client', {
    name: (note.clientName ?? '').trim().toUpperCase() || t('coach.notes.edit.clientUnknown'),
  });
}
function EditNoteModalFooter(props: {
  isSaving?: boolean;
  onClose: () => void;
  onSave: () => void;
  t: TFunc;
}): React.JSX.Element {
  return (
    <>
      <Button label={props.t('common.cancel')} onPress={props.onClose} variant={VARIANT_SECONDARY} />
      <Button
        icon={<Check color={tk.onPrimary} size={18} strokeWidth={2.5} />}
        label={props.t('coach.notes.edit.finish')}
        loading={props.isSaving}
        onPress={props.onSave}
      />
    </>
  );
}
export type DeleteConfirmModalProps = {
  isDeleting?: boolean;
  note: NoteData | null;
  onCancel: () => void;
  onConfirm: () => void;
  t: (k: string) => string;
};
export function DeleteConfirmModal(props: DeleteConfirmModalProps): React.JSX.Element {
  const layoutStyle2 = getLayoutStyle2;
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={
        <>
          <Button label={props.t('common.cancel')} onPress={props.onCancel} variant={VARIANT_SECONDARY} />
          <Button
            label={props.t('coach.notes.delete.action')}
            loading={props.isDeleting}
            onPress={props.onConfirm}
            variant={VARIANT_DANGER}
          />
        </>
      }
      onClose={props.onCancel}
      size={MODAL_SIZE_SM}
      title={props.t('coach.notes.delete.title')}
      visible={!!props.note}
    >
      <Text style={layoutStyle2}>{props.t('coach.notes.delete.confirm')}</Text>
    </Modal>
  );
}
const noteBadgeRowStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: space.lg,
};
function noteBadgeStyle(type: NoteData['type']) {
  return {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    backgroundColor: type === 'general' ? tk.primarySoft : tk.successSoft,
    maxWidth: '65%' as unknown as number,
  };
}
function noteBadgeTextStyle(type: NoteData['type']) {
  return {
    fontSize: fontSize.xs,
    fontWeight: 'bold' as const,
    color: type === 'general' ? tk.primary : tk.success,
  };
}
