import {
  getLayoutStyle1,
  getLayoutStyle2,
  getLayoutStyle3,
  getLayoutStyle4,
  getLayoutStyle5,
} from './CalendarScreen.modals.forms.layout-styles';

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Check } from 'lucide-react';
import { CALL_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';
import { Badge, Button, DateTimeField, Modal, TextField, colors as tk } from '@trainerpro/ui';
const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;
const TONE_PRIMARY = 'primary' as const;
const TONE_SUCCESS = 'success' as const;
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
// ── Shared sub-components ────────────────────────────────────────────────────
type FormFooterProps = {
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  label: string;
  t: TFunc;
};
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
  initialValues?: {
    title: string;
    content: string;
    color: string;
  };
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
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
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
      <View style={layoutStyle1}>
        {clientName ? (
          <View style={layoutStyle2}>
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
  initialDate: string;
  clientName?: string;
  initialValues?: {
    content: string;
    time: string;
    color: string;
  };
  modalTitle?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (data: { date: string; content: string; time: string; color: string }) => void;
  isSaving: boolean;
  t: TFunc;
};
export function AddReminderModal({
  initialDate,
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
  const [date, setDate] = useState(initialDate);
  const color = CALL_COLOR.bg;
  const layoutStyle3 = getLayoutStyle3;
  const layoutStyle4 = getLayoutStyle4;
  const layoutStyle5 = getLayoutStyle5;
  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <FormFooter
          isSaving={isSaving}
          label={saveLabel ?? t('coach.calendar.reminder.save')}
          onClose={onClose}
          onSave={() => onSave({ date, content, time, color })}
          t={t}
        />
      }
      onClose={onClose}
      size={SIZE_SM}
      title={modalTitle ?? t('coach.calendar.reminder.title')}
      visible
    >
      <View style={layoutStyle3}>
        {clientName ? (
          <View style={layoutStyle4}>
            <Badge label={clientName} tone={TONE_SUCCESS} />
          </View>
        ) : null}
        <DateTimeField label={t('coach.calendar.call.dateLabel')} type={'date'} value={date} onChange={setDate} />
        <DateTimeField
          label={t('coach.calendar.reminder.time')}
          type={'time'}
          step={900}
          min={'08:00'}
          max={'21:45'}
          value={time}
          onChange={setTime}
        />
        <TextField
          label={t('coach.calendar.reminder.content')}
          multiline
          numberOfLines={3}
          onChangeText={setContent}
          placeholder={t('coach.calendar.reminder.content')}
          value={content}
        />
        <Text style={layoutStyle5}>{t('coach.calendar.call.proposalHint')}</Text>
      </View>
    </Modal>
  );
}
