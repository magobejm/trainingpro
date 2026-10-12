import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Check } from 'lucide-react';
import { CALL_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';
import { Badge, Button, Field, Modal, TextField, colors as tk, fontSize, radius, space } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;
const TONE_PRIMARY = 'primary' as const;
const TONE_SUCCESS = 'success' as const;

const TIME_INPUT_TYPE = 'time' as const;

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

// ── Shared sub-components ────────────────────────────────────────────────────

type FormFooterProps = { onClose: () => void; onSave: () => void; isSaving: boolean; label: string; t: TFunc };

function FormFooter({ onClose, onSave, isSaving, label, t }: FormFooterProps): React.JSX.Element {
  return (
    <>
      <Button label={t('common.cancel')} onPress={onClose} variant={VARIANT_SECONDARY} />
      <Button icon={<Check color={tk.onPrimary} size={16} />} label={label} loading={isSaving} onPress={onSave} />
    </>
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
    <Modal
      closeLabel={t('common.close')}
      footer={
        <FormFooter
          isSaving={isSaving}
          label={saveLabel ?? t('coach.calendar.note.save')}
          onClose={onClose}
          onSave={() => onSave({ title, content, color })}
          t={t}
        />
      }
      onClose={onClose}
      size={SIZE_SM}
      title={modalTitle ?? t('coach.calendar.note.title')}
      visible
    >
      <View style={{ gap: space.md }}>
        {clientName ? (
          <View style={{ alignSelf: 'flex-start' }}>
            <Badge label={clientName} tone={TONE_PRIMARY} />
          </View>
        ) : null}
        <TextField
          label={t('coach.calendar.note.titleField')}
          onChangeText={setTitle}
          placeholder={t('coach.calendar.note.titleField')}
          value={title}
        />
        <TextField
          label={t('coach.calendar.note.content')}
          multiline
          numberOfLines={4}
          onChangeText={setContent}
          placeholder={t('coach.calendar.note.content')}
          value={content}
        />
      </View>
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
    <Modal
      closeLabel={t('common.close')}
      footer={
        <FormFooter
          isSaving={isSaving}
          label={saveLabel ?? t('coach.calendar.reminder.save')}
          onClose={onClose}
          onSave={() => onSave({ content, time, color })}
          t={t}
        />
      }
      onClose={onClose}
      size={SIZE_SM}
      title={modalTitle ?? t('coach.calendar.reminder.title')}
      visible
    >
      <View style={{ gap: space.md }}>
        {clientName ? (
          <View style={{ alignSelf: 'flex-start' }}>
            <Badge label={clientName} tone={TONE_SUCCESS} />
          </View>
        ) : null}
        <Field label={t('coach.calendar.reminder.time')}>
          <input
            aria-label={t('coach.calendar.reminder.time')}
            type={TIME_INPUT_TYPE}
            value={time}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
            style={{
              width: '100%',
              border: `1px solid ${tk.border}`,
              borderRadius: radius.md,
              padding: `${space.sm}px ${space.md}px`,
              fontSize: fontSize.sm,
              boxSizing: 'border-box',
              color: tk.text,
              minHeight: 40,
            }}
          />
        </Field>
        <TextField
          label={t('coach.calendar.reminder.content')}
          multiline
          numberOfLines={3}
          onChangeText={setContent}
          placeholder={t('coach.calendar.reminder.content')}
          value={content}
        />
        <Text style={{ fontSize: fontSize.xs, color: tk.textMuted }}>{t('coach.calendar.call.proposalHint')}</Text>
      </View>
    </Modal>
  );
}
