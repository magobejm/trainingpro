import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { FileText, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import { formatCalendarDate, getColorForHex } from './calendar-screen.utils';

export { AddNoteModal, AddReminderModal } from './CalendarScreen.modals.forms';

const MODAL_ANIMATION = 'fade' as const;
const COLOR_GREEN = '#15803d' as const;
const TIME_ICON = '⏰ ' as const;

const colors = {
  primary: '#3b82f6',
  danger: '#ef4444',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
};

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

// ── DayDetailModal ────────────────────────────────────────────────────────────

type DayModalProps = {
  dateStr: string;
  dayEvents: CalendarEventData[];
  onClose: () => void;
  onAddNote: () => void;
  onAddReminder: () => void;
  onDeleteEvent: (eventId: string) => void;
  onEditEvent?: (event: CalendarEventData) => void;
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

type DayEventListProps = {
  dayEvents: CalendarEventData[];
  onDeleteEvent: (id: string) => void;
  onEditEvent?: (ev: CalendarEventData) => void;
  t: TFunc;
};

function DayEventList({ dayEvents, onDeleteEvent, onEditEvent, t }: DayEventListProps): React.JSX.Element {
  return (
    <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} contentContainerStyle={{ padding: 16 }}>
      {dayEvents.length === 0 && (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <FileText color={colors.border} size={32} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>{t('coach.calendar.empty')}</Text>
        </View>
      )}
      {dayEvents.map((ev) => (
        <EventRow
          key={ev.id}
          event={ev}
          onDelete={() => onDeleteEvent(ev.id)}
          onEdit={onEditEvent ? () => onEditEvent(ev) : undefined}
          t={t}
        />
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
  onEditEvent,
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
          <DayEventList dayEvents={dayEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} t={t} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type EventRowProps = { event: CalendarEventData; onDelete: () => void; onEdit?: () => void; t: TFunc };

function EventRow({ event, onDelete, onEdit, t }: EventRowProps): React.JSX.Element {
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
        {event.type !== 'workout' && onEdit != null && (
          <Pressable
            onPress={onEdit}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(59,130,246,0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Pencil color={colors.primary} size={13} />
          </Pressable>
        )}
        <Pressable
          onPress={onDelete}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(239,68,68,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Trash2 color={colors.danger} size={13} />
        </Pressable>
      </View>
    </View>
  );
}
