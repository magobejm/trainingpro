import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Check, Plus, StickyNote, X } from 'lucide-react';
import { CALL_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIMATION = 'fade' as const;
const COLOR_WHITE = tk.surface;
const COLOR_GREEN = tk.success;
const TIME_INPUT_TYPE = 'time' as const;
const COLOR_NOTE_SAVING = tk.primaryBorder;
const COLOR_REMINDER = tk.success;
const COLOR_REMINDER_SAVING = tk.successSoft;

const colors = {
  primary: tk.primary,
  text: tk.text,
  textMuted: tk.textMuted,
  border: tk.border,
  bg: tk.surfaceMuted,
};

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

// ── Shared sub-components ────────────────────────────────────────────────────

type ModalHeaderProps = { title: string; icon: React.ReactNode; onClose: () => void };

export function ModalHeader({ title, icon, onClose }: ModalHeaderProps): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: space.xl,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {icon}
        <Text style={{ fontSize: fontSize.md, fontWeight: 'bold', color: colors.text }}>{title}</Text>
      </View>
      <Pressable
        onPress={onClose}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <X color={colors.textMuted} size={16} />
      </Pressable>
    </View>
  );
}

type SaveButtonProps = { onPress: () => void; isSaving: boolean; label: string; bgColor: string; savingBgColor: string };

function ModalSaveButton({ onPress, isSaving, label, bgColor, savingBgColor }: SaveButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSaving}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isSaving ? savingBgColor : bgColor,
        borderRadius: radius.lg,
        paddingVertical: space.md,
        marginTop: space.lg,
        gap: space.sm,
      }}
    >
      <Check color={COLOR_WHITE} size={16} />
      <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: COLOR_WHITE }}>{isSaving ? '...' : label}</Text>
    </Pressable>
  );
}

// ── AddNoteModal ──────────────────────────────────────────────────────────────

type AddNoteModalProps = {
  clientName?: string;
  initialValues?: { title: string; content: string; color: string };
  modalTitle?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (data: { title: string; content: string; color: string }) => void;
  isSaving: boolean;
  t: TFunc;
};

export function AddNoteModal({
  clientName,
  initialValues,
  modalTitle,
  saveLabel,
  onClose,
  onSave,
  isSaving,
  t,
}: AddNoteModalProps): React.JSX.Element {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const color = COACH_NOTE_COLOR.bg;

  return (
    <Modal transparent animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: 420, maxWidth: '95%', backgroundColor: 'white', borderRadius: 20, overflow: 'hidden' }}
        >
          <ModalHeader
            title={modalTitle ?? t('coach.calendar.note.title')}
            icon={<StickyNote color={colors.primary} size={18} />}
            onClose={onClose}
          />
          <View style={{ padding: space.xl }}>
            {clientName && (
              <View
                style={{
                  backgroundColor: tk.primarySoft,
                  borderRadius: radius.md,
                  paddingVertical: space.sm,
                  paddingHorizontal: space.md,
                  marginBottom: space.lg,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: 'bold' }}>{clientName}</Text>
              </View>
            )}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('coach.calendar.note.titleField')}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: space.md,
                fontSize: fontSize.sm,
                marginBottom: space.md,
                color: colors.text,
              }}
            />
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={t('coach.calendar.note.content')}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: space.md,
                fontSize: fontSize.sm,
                marginBottom: space.lg,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
            <ModalSaveButton
              onPress={() => onSave({ title, content, color })}
              isSaving={isSaving}
              label={saveLabel ?? t('coach.calendar.note.save')}
              bgColor={colors.primary}
              savingBgColor={COLOR_NOTE_SAVING}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── AddReminderModal ──────────────────────────────────────────────────────────

type AddReminderModalProps = {
  clientName?: string;
  initialValues?: { content: string; time: string; color: string };
  modalTitle?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (data: { content: string; time: string; color: string }) => void;
  isSaving: boolean;
  t: TFunc;
};

export function AddReminderModal({
  clientName,
  initialValues,
  modalTitle,
  saveLabel,
  onClose,
  onSave,
  isSaving,
  t,
}: AddReminderModalProps): React.JSX.Element {
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [time, setTime] = useState(initialValues?.time ?? '09:00');
  const color = CALL_COLOR.bg;

  return (
    <Modal transparent animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: 420, maxWidth: '95%', backgroundColor: 'white', borderRadius: 20, overflow: 'hidden' }}
        >
          <ModalHeader
            title={modalTitle ?? t('coach.calendar.reminder.title')}
            icon={<Plus color={COLOR_GREEN} size={18} />}
            onClose={onClose}
          />
          <View style={{ padding: space.xl }}>
            {clientName && (
              <View
                style={{
                  backgroundColor: tk.successSoft,
                  borderRadius: radius.md,
                  paddingVertical: space.sm,
                  paddingHorizontal: space.md,
                  marginBottom: space.lg,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: fontSize.xs, color: COLOR_GREEN, fontWeight: 'bold' }}>{clientName}</Text>
              </View>
            )}
            <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: colors.textMuted, marginBottom: space.sm }}>
              {t('coach.calendar.reminder.time')}
            </Text>
            <input
              type={TIME_INPUT_TYPE}
              value={time}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                padding: '10px 12px',
                fontSize: fontSize.sm,
                marginBottom: space.md,
                boxSizing: 'border-box',
                color: colors.text,
              }}
            />
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={t('coach.calendar.reminder.content')}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: space.md,
                fontSize: fontSize.sm,
                marginBottom: space.lg,
                color: colors.text,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: space.xs }}>
              {t('coach.calendar.call.proposalHint')}
            </Text>
            <ModalSaveButton
              onPress={() => onSave({ content, time, color })}
              isSaving={isSaving}
              label={saveLabel ?? t('coach.calendar.reminder.save')}
              bgColor={COLOR_REMINDER}
              savingBgColor={COLOR_REMINDER_SAVING}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
