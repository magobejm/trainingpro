import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Check, Pencil } from 'lucide-react';
import type { NoteData } from './notes-screen.types';
import { formatNoteDate } from './notes-screen.utils';

const ICON_CLOSE = '✕' as const;
const MODAL_ANIMATION = 'fade' as const;
const COLOR_WHITE = '#ffffff' as const;

const colors = {
  primary: '#3b82f6',
  text: '#0f172a',
  textMuted: '#64748b',
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
        <View style={{ marginRight: 10 }}>
          <Pencil color={colors.primary} size={22} strokeWidth={2} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{props.t('coach.notes.edit.title')}</Text>
      </View>
      <Pressable onPress={props.onClose} hitSlop={8}>
        <Text style={{ fontSize: 20, color: colors.textMuted }}>{ICON_CLOSE}</Text>
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
    <View style={{ padding: 24 }}>
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
      <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{formatNoteDate(note.createdAt, props.t)}</Text>
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
        <View style={{ marginRight: 8 }}>
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
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
            {props.t('coach.notes.delete.title')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
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
  padding: 24,
};

const modalCardStyle = {
  backgroundColor: 'white',
  borderRadius: 24,
  width: '100%' as const,
  maxWidth: 600,
  maxHeight: '80%' as unknown as number,
};

const modalHeaderStyle = {
  padding: 24,
  borderBottomWidth: 1,
  borderColor: '#e2e8f0',
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

const editorInputStyle = {
  backgroundColor: '#f8fafc',
  borderWidth: 1,
  borderColor: '#bfdbfe',
  borderRadius: 12,
  padding: 16,
  minHeight: 250,
  fontSize: 16,
};

const noteBadgeRowStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 16,
};

function noteBadgeStyle(type: NoteData['type']) {
  return {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: type === 'general' ? '#eff6ff' : '#dcfce7',
    maxWidth: '65%' as unknown as number,
  };
}

function noteBadgeTextStyle(type: NoteData['type']) {
  return {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: type === 'general' ? '#2563eb' : '#16a34a',
  };
}

const modalFooterStyle = {
  padding: 24,
  borderTopWidth: 1,
  borderColor: '#e2e8f0',
  backgroundColor: '#fafafa',
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
  alignItems: 'center' as const,
};

const cancelButtonStyle = {
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 12,
  marginRight: 8,
};

const saveButtonStyle = {
  backgroundColor: colors.primary,
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 12,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const deleteModalCardStyle = {
  backgroundColor: 'white',
  borderRadius: 24,
  width: '100%' as const,
  maxWidth: 400,
  padding: 24,
};

const deleteCancelButtonStyle = {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12,
  marginRight: 12,
};

const deleteConfirmButtonStyle = {
  backgroundColor: '#ef4444',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12,
};
