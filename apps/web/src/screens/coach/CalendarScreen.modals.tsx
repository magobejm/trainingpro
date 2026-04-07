import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, FileText, Plus, StickyNote, Trash2, X } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';
import { formatCalendarDate, getColorForHex } from './calendar-screen.utils';

const MODAL_ANIMATION = 'fade' as const;
const COLOR_WHITE = '#ffffff' as const;
const COLOR_GREEN = '#15803d' as const;
const TIME_ICON = '⏰ ' as const;
const TIME_INPUT_TYPE = 'time' as const;
const COLOR_NOTE_SAVING = '#93c5fd' as const;
const COLOR_REMINDER = '#22c55e' as const;
const COLOR_REMINDER_SAVING = '#86efac' as const;

const colors = {
  primary: '#3b82f6',
  danger: '#ef4444',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
};

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

// ── Shared sub-components ────────────────────────────────────────────────────

type ModalHeaderProps = { title: string; icon: React.ReactNode; onClose: () => void };

function ModalHeader({ title, icon, onClose }: ModalHeaderProps): React.JSX.Element {
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
  const savingLabel = '...';
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
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLOR_WHITE }}>{isSaving ? savingLabel : label}</Text>
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

// ── DayDetailModal ────────────────────────────────────────────────────────────

type DayModalProps = {
  dateStr: string;
  dayEvents: CalendarEventData[];
  onClose: () => void;
  onAddNote: () => void;
  onAddReminder: () => void;
  onDeleteEvent: (eventId: string) => void;
  t: TFunc;
};

type DayDetailHeaderProps = { dateStr: string; eventCount: number; onClose: () => void; t: TFunc };

function DayDetailHeader({ dateStr, eventCount, onClose, t }: DayDetailHeaderProps): React.JSX.Element {
  const date = new Date(dateStr + 'T12:00:00');
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
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{formatCalendarDate(date)}</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>
          {eventCount} {t('coach.calendar.day.events')}
        </Text>
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

type DayEventListProps = { dayEvents: CalendarEventData[]; onDeleteEvent: (id: string) => void; t: TFunc };

function DayEventList({ dayEvents, onDeleteEvent, t }: DayEventListProps): React.JSX.Element {
  return (
    <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} contentContainerStyle={{ padding: 16 }}>
      {dayEvents.length === 0 && (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <FileText color={colors.border} size={32} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>{t('coach.calendar.empty')}</Text>
        </View>
      )}
      {dayEvents.map((ev) => (
        <EventRow key={ev.id} event={ev} onDelete={() => onDeleteEvent(ev.id)} t={t} />
      ))}
    </ScrollView>
  );
}

export function DayDetailModal({
  dateStr,
  dayEvents,
  onClose,
  onAddNote,
  onAddReminder,
  onDeleteEvent,
  t,
}: DayModalProps): React.JSX.Element {
  return (
    <Modal transparent animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: 480,
            maxWidth: '95%',
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            maxHeight: '80%',
          }}
        >
          <DayDetailHeader dateStr={dateStr} eventCount={dayEvents.length} onClose={onClose} t={t} />
          <View
            style={{
              flexDirection: 'row',
              padding: 16,
              gap: 8,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexShrink: 0,
            }}
          >
            <Pressable
              onPress={onAddNote}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#eff6ff',
                borderRadius: 12,
                paddingVertical: 10,
                gap: 6,
              }}
            >
              <StickyNote color={colors.primary} size={15} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary }}>
                {t('coach.calendar.day.addNote')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onAddReminder}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0fdf4',
                borderRadius: 12,
                paddingVertical: 10,
                gap: 6,
              }}
            >
              <Plus color={COLOR_GREEN} size={15} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLOR_GREEN }}>
                {t('coach.calendar.day.addReminder')}
              </Text>
            </Pressable>
          </View>
          <DayEventList dayEvents={dayEvents} onDeleteEvent={onDeleteEvent} t={t} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EventRow({ event, onDelete, t }: { event: CalendarEventData; onDelete: () => void; t: TFunc }): React.JSX.Element {
  const colorObj = getColorForHex(event.color ?? '');
  const typeLabel = t(`coach.calendar.type.${event.type}`);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colorObj.border,
        backgroundColor: colorObj.bg,
        marginBottom: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: colorObj.text,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {typeLabel}
          </Text>
          {event.clientName && <Text style={{ fontSize: 10, color: colorObj.text, opacity: 0.7 }}>{event.clientName}</Text>}
          {event.time && (
            <Text style={{ fontSize: 10, color: colorObj.text, opacity: 0.7 }}>
              {TIME_ICON}
              {event.time}
            </Text>
          )}
        </View>
        {event.title && <Text style={{ fontSize: 14, fontWeight: 'bold', color: colorObj.text }}>{event.title}</Text>}
        {event.planDayTitle && !event.title && (
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colorObj.text }}>{event.planDayTitle}</Text>
        )}
        {event.content && (
          <Text style={{ fontSize: 13, color: colorObj.text, opacity: 0.8, marginTop: 2 }}>{event.content}</Text>
        )}
      </View>
      <Pressable
        onPress={onDelete}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: 'rgba(239,68,68,0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 8,
        }}
      >
        <Trash2 color={colors.danger} size={13} />
      </Pressable>
    </View>
  );
}

// ── AddNoteModal ──────────────────────────────────────────────────────────────

type AddNoteModalProps = {
  clientName?: string;
  onClose: () => void;
  onSave: (data: { title: string; content: string; color: string }) => void;
  isSaving: boolean;
  t: TFunc;
};

export function AddNoteModal({ clientName, onClose, onSave, isSaving, t }: AddNoteModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState((CALENDAR_COLORS[0] as (typeof CALENDAR_COLORS)[number]).bg);

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
            title={t('coach.calendar.note.title')}
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
              label={t('coach.calendar.note.save')}
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
  onClose: () => void;
  onSave: (data: { content: string; time: string; color: string }) => void;
  isSaving: boolean;
  t: TFunc;
};

export function AddReminderModal({ clientName, onClose, onSave, isSaving, t }: AddReminderModalProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [time, setTime] = useState('09:00');
  const [color, setColor] = useState((CALENDAR_COLORS[1] as (typeof CALENDAR_COLORS)[number]).bg);

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
            title={t('coach.calendar.reminder.title')}
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
              label={t('coach.calendar.reminder.save')}
              bgColor={COLOR_REMINDER}
              savingBgColor={COLOR_REMINDER_SAVING}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
