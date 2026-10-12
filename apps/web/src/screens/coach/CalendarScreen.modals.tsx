import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { FileText, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import { formatCalendarDate, getColorForHex } from './calendar-screen.utils';
import { workoutStatusLines } from './calendar-workout-label';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';

export { AddNoteModal, AddReminderModal } from './CalendarScreen.modals.forms';

const MODAL_ANIMATION = 'fade' as const;
const COLOR_GREEN = tk.success;
const TIME_ICON = '⏰ ' as const;

const colors = {
  primary: tk.primary,
  danger: tk.danger,
  text: tk.text,
  textMuted: tk.textMuted,
  border: tk.border,
  bg: tk.surfaceMuted,
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
        padding: space.xl,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View>
        <Text style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text }}>{formatCalendarDate(date)}</Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>
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
    <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} contentContainerStyle={{ padding: space.lg }}>
      {dayEvents.length === 0 && (
        <View style={{ alignItems: 'center', padding: space.xl }}>
          <FileText color={colors.border} size={32} />
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.sm }}>
            {t('coach.calendar.empty')}
          </Text>
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
              padding: space.lg,
              gap: space.sm,
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
                backgroundColor: tk.primarySoft,
                borderRadius: radius.lg,
                paddingVertical: space.md,
                gap: space.sm,
              }}
            >
              <StickyNote color={colors.primary} size={15} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: colors.primary }}>
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
                backgroundColor: tk.successSoft,
                borderRadius: radius.lg,
                paddingVertical: space.md,
                gap: space.sm,
              }}
            >
              <Plus color={COLOR_GREEN} size={15} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: COLOR_GREEN }}>
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
  const { i18n } = useTranslation();
  const colorObj = getColorForHex(event.color ?? '');
  const typeLabel = t(`coach.calendar.type.${event.type}`);
  const statusLines = workoutStatusLines(event, t, i18n.language);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: space.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colorObj.border,
        backgroundColor: colorObj.bg,
        marginBottom: space.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs }}>
          <Text
            style={{
              fontSize: fontSize.xs,
              fontWeight: 'bold',
              color: colorObj.text,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {typeLabel}
          </Text>
          {event.clientName && (
            <Text style={{ fontSize: fontSize.xs, color: colorObj.text, opacity: 0.7 }}>{event.clientName}</Text>
          )}
          {event.time && (
            <Text style={{ fontSize: fontSize.xs, color: colorObj.text, opacity: 0.7 }}>
              {TIME_ICON}
              {event.time}
            </Text>
          )}
        </View>
        {event.title && (
          <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: colorObj.text }}>{event.title}</Text>
        )}
        {event.planDayTitle && !event.title && (
          <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: colorObj.text }}>{event.planDayTitle}</Text>
        )}
        {event.content && (
          <Text style={{ fontSize: fontSize.sm, color: colorObj.text, opacity: 0.8, marginTop: 2 }}>{event.content}</Text>
        )}
        {statusLines.map((line) => (
          <Text key={line} style={{ fontSize: fontSize.xs, color: colorObj.text, fontWeight: '600', marginTop: 2 }}>
            {line}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: space.sm }}>
        {event.type !== 'workout' && event.type !== 'physical_test' && onEdit != null && (
          <Pressable
            onPress={onEdit}
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.lg,
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
            borderRadius: radius.lg,
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
