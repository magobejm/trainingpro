import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Check, Plus, StickyNote, X } from 'lucide-react';
import { CALENDAR_COLORS } from './calendar-screen.types';

const MODAL_ANIMATION = 'fade' as const;
const COLOR_WHITE = '#ffffff' as const;
const COLOR_GREEN = '#15803d' as const;
const TIME_INPUT_TYPE = 'time' as const;
const COLOR_NOTE_SAVING = '#93c5fd' as const;
const COLOR_REMINDER = '#22c55e' as const;
const COLOR_REMINDER_SAVING = '#86efac' as const;

const colors = {
  primary: '#3b82f6',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
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
        padding: 20,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{title}</Text>
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
        borderRadius: 14,
        paddingVertical: 12,
        marginTop: 16,
        gap: 8,
      }}
    >
      <Check color={COLOR_WHITE} size={16} />
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLOR_WHITE }}>{isSaving ? '...' : label}</Text>
    </Pressable>
  );
}

type ColorPickerProps = { selectedColor: string; onSelect: (c: string) => void; t: TFunc };

function ColorPicker({ selectedColor, onSelect, t }: ColorPickerProps): React.JSX.Element {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textMuted, marginBottom: 8 }}>
        {t('coach.calendar.colorPicker.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {CALENDAR_COLORS.map((c) => (
          <Pressable
            key={c.bg}
            onPress={() => onSelect(c.bg)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: c.bg,
              borderWidth: selectedColor === c.bg ? 2 : 1,
              borderColor: selectedColor === c.bg ? colors.text : c.border,
            }}
          />
        ))}
      </View>
    </View>
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
  const defaultColor = (CALENDAR_COLORS[0] as (typeof CALENDAR_COLORS)[number]).bg;
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [color, setColor] = useState(initialValues?.color ?? defaultColor);

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
          <View style={{ padding: 20 }}>
            {clientName && (
              <View
                style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: 10,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  marginBottom: 16,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold' }}>{clientName}</Text>
              </View>
            )}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('coach.calendar.note.titleField')}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                marginBottom: 12,
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
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                marginBottom: 16,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
            <ColorPicker selectedColor={color} onSelect={setColor} t={t} />
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
  const defaultColor = (CALENDAR_COLORS[1] as (typeof CALENDAR_COLORS)[number]).bg;
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [time, setTime] = useState(initialValues?.time ?? '09:00');
  const [color, setColor] = useState(initialValues?.color ?? defaultColor);

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
          <View style={{ padding: 20 }}>
            {clientName && (
              <View
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: 10,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  marginBottom: 16,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 12, color: COLOR_GREEN, fontWeight: 'bold' }}>{clientName}</Text>
              </View>
            )}
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textMuted, marginBottom: 6 }}>
              {t('coach.calendar.reminder.time')}
            </Text>
            <input
              type={TIME_INPUT_TYPE}
              value={time}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 14,
                marginBottom: 12,
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
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                marginBottom: 16,
                color: colors.text,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
            <ColorPicker selectedColor={color} onSelect={setColor} t={t} />
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
