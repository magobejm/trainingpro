import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { FileText, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import { formatCalendarDate, getColorForHex } from './calendar-screen.utils';
import { workoutStatusLines } from './calendar-workout-label';
import { Button, EmptyState, IconButton, Modal, colors as tk, fontSize, radius, space } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const TONE_DANGER = 'danger' as const;

export { AddNoteModal, AddReminderModal } from './CalendarScreen.modals.forms';

const MODAL_SIZE = 'md' as const;
const TIME_ICON = '⏰ ' as const;

const colors = {
  primary: tk.primary,
  danger: tk.danger,
  text: tk.text,
  textMuted: tk.textMuted,
  border: tk.border,
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

type DayEventListProps = {
  dayEvents: CalendarEventData[];
  onDeleteEvent: (id: string) => void;
  onEditEvent?: (ev: CalendarEventData) => void;
  t: TFunc;
};

function DayEventList({ dayEvents, onDeleteEvent, onEditEvent, t }: DayEventListProps): React.JSX.Element {
  return (
    <View>
      {dayEvents.length === 0 && (
        <EmptyState icon={<FileText color={colors.border} size={32} />} title={t('coach.calendar.empty')} />
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
    </View>
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
  const date = new Date(dateStr + 'T12:00:00');
  return (
    <Modal closeLabel={t('common.close')} onClose={onClose} size={MODAL_SIZE} title={formatCalendarDate(date)} visible>
      <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.md }}>
        {dayEvents.length} {t('coach.calendar.day.events')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
        <Button
          icon={<StickyNote color={colors.primary} size={15} />}
          label={t('coach.calendar.day.addNote')}
          onPress={onAddNote}
          style={{ flex: 1 }}
          variant={VARIANT_SECONDARY}
        />
        <Button
          icon={<Plus color={colors.primary} size={15} />}
          label={t('coach.calendar.day.addReminder')}
          onPress={onAddReminder}
          style={{ flex: 1 }}
          variant={VARIANT_SECONDARY}
        />
      </View>
      <DayEventList dayEvents={dayEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} t={t} />
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
          <IconButton
            accessibilityLabel={t('coach.calendar.event.edit')}
            icon={(color) => <Pencil color={color} size={13} />}
            onPress={onEdit}
            size={28}
          />
        )}
        <IconButton
          accessibilityLabel={t('coach.calendar.event.delete')}
          icon={(color) => <Trash2 color={color} size={13} />}
          onPress={onDelete}
          size={28}
          tone={TONE_DANGER}
        />
      </View>
    </View>
  );
}
