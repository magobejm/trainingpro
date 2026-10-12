import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Check, Pencil } from 'lucide-react';
import type { NoteData } from './notes-screen.types';
import { formatNoteDate } from './notes-screen.utils';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';

const ICON_CLOSE = '✕' as const;
const MODAL_ANIMATION = 'fade' as const;
const COLOR_WHITE = tk.surface;

const colors = {
  primary: tk.primary,
  text: tk.text,
  textMuted: tk.textMuted,
};

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

export type EditNoteModalProps = {
  editingNote: NoteData | null;
  editContent: string;
  setEditContent: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  t: TFunc;
};

export function EditNoteModal(props: EditNoteModalProps): React.JSX.Element {
  return (
    <Modal animationType={MODAL_ANIMATION} visible={Boolean(props.editingNote)} transparent>
      <View style={modalOverlayStyle}>
        <View style={modalCardStyle}>
          <EditNoteModalHeader onClose={props.onClose} t={props.t} />
          <EditNoteModalBody
            editContent={props.editContent}
            editingNote={props.editingNote}
            setEditContent={props.setEditContent}
            t={props.t}
          />
          <EditNoteModalFooter onClose={props.onClose} onSave={props.onSave} t={props.t} />
        </View>
      </View>
    </Modal>
  );
}

function EditNoteModalHeader(props: { onClose: () => void; t: TFunc }): React.JSX.Element {
  return (
    <View style={modalHeaderStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ marginRight: space.md }}>
          <Pencil color={colors.primary} size={22} strokeWidth={2} />
        </View>
        <Text style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text }}>
          {props.t('coach.notes.edit.title')}
        </Text>
      </View>
      <Pressable onPress={props.onClose} hitSlop={8}>
        <Text style={{ fontSize: fontSize.xl, color: colors.textMuted }}>{ICON_CLOSE}</Text>
      </Pressable>
    </View>
  );
}

function EditNoteModalBody(props: {
  editContent: string;
  editingNote: NoteData | null;
  setEditContent: (v: string) => void;
  t: TFunc;
}): React.JSX.Element {
  return (
    <View style={{ padding: space.xl }}>
      <EditNoteMetaBadge editingNote={props.editingNote} t={props.t} />
      <TextInput value={props.editContent} onChangeText={props.setEditContent} multiline style={editorInputStyle} />
    </View>
  );
}

function EditNoteMetaBadge(props: { editingNote: NoteData | null; t: TFunc }): React.JSX.Element | null {
  const note = props.editingNote;
  if (!note) {
    return null;
  }
  return (
    <View style={noteBadgeRowStyle}>
      <View style={noteBadgeStyle(note.type)}>
        <Text style={noteBadgeTextStyle(note.type)} numberOfLines={2}>
          {readEditBadgeLabel(note, props.t)}
        </Text>
      </View>
      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginLeft: space.sm }}>
        {formatNoteDate(note.createdAt, props.t)}
      </Text>
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

function EditNoteModalFooter(props: { onClose: () => void; onSave: () => void; t: TFunc }): React.JSX.Element {
  return (
    <View style={modalFooterStyle}>
      <Pressable onPress={props.onClose} style={cancelButtonStyle}>
        <Text style={{ fontWeight: 'bold', color: colors.text }}>{props.t('common.cancel')}</Text>
      </Pressable>
      <Pressable onPress={props.onSave} style={saveButtonStyle}>
        <View style={{ marginRight: space.sm }}>
          <Check color={COLOR_WHITE} size={18} strokeWidth={2.5} />
        </View>
        <Text style={{ color: COLOR_WHITE, fontWeight: 'bold' }}>{props.t('coach.notes.edit.finish')}</Text>
      </Pressable>
    </View>
  );
}

export type DeleteConfirmModalProps = {
  note: NoteData | null;
  onCancel: () => void;
  onConfirm: () => void;
  t: (k: string) => string;
};

export function DeleteConfirmModal(props: DeleteConfirmModalProps): React.JSX.Element {
  return (
    <Modal animationType={MODAL_ANIMATION} visible={!!props.note} transparent>
      <View style={modalOverlayStyle}>
        <View style={deleteModalCardStyle}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, marginBottom: space.lg }}>
            {props.t('coach.notes.delete.title')}
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.xl }}>
            {props.t('coach.notes.delete.confirm')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable onPress={props.onCancel} style={deleteCancelButtonStyle}>
              <Text style={{ fontWeight: 'bold', color: colors.textMuted }}>{props.t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={props.onConfirm} style={deleteConfirmButtonStyle}>
              <Text style={{ color: COLOR_WHITE, fontWeight: 'bold' }}>{props.t('coach.notes.delete.action')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalOverlayStyle = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  padding: space.xl,
};

const modalCardStyle = {
  backgroundColor: 'white',
  borderRadius: 24,
  width: '100%' as const,
  maxWidth: 600,
  maxHeight: '80%' as unknown as number,
};

const modalHeaderStyle = {
  padding: space.xl,
  borderBottomWidth: 1,
  borderColor: tk.border,
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

const editorInputStyle = {
  backgroundColor: tk.surfaceMuted,
  borderWidth: 1,
  borderColor: tk.primaryBorder,
  borderRadius: radius.lg,
  padding: space.lg,
  minHeight: 250,
  fontSize: fontSize.md,
};

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

const modalFooterStyle = {
  padding: space.xl,
  borderTopWidth: 1,
  borderColor: tk.border,
  backgroundColor: tk.surfaceMuted,
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
  alignItems: 'center' as const,
};

const cancelButtonStyle = {
  paddingHorizontal: space.xl,
  paddingVertical: space.md,
  borderRadius: radius.lg,
  marginRight: space.sm,
};

const saveButtonStyle = {
  backgroundColor: colors.primary,
  paddingHorizontal: space.xl,
  paddingVertical: space.md,
  borderRadius: radius.lg,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const deleteModalCardStyle = {
  backgroundColor: 'white',
  borderRadius: 24,
  width: '100%' as const,
  maxWidth: 400,
  padding: space.xl,
};

const deleteCancelButtonStyle = {
  paddingHorizontal: space.xl,
  paddingVertical: space.md,
  borderRadius: radius.lg,
  marginRight: space.md,
};

const deleteConfirmButtonStyle = {
  backgroundColor: tk.danger,
  paddingHorizontal: space.xl,
  paddingVertical: space.md,
  borderRadius: radius.lg,
};
