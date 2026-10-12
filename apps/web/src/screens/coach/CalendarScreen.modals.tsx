import {
  getLayoutStyle1,
  getLayoutStyle2,
  getLayoutStyle3,
  getLayoutStyle4,
  getLayoutStyle5,
  getLayoutStyle6,
  getLayoutStyle7,
  getLayoutStyle8,
  getLayoutStyle9,
  getLayoutStyle10,
  getLayoutStyle11,
  getLayoutStyle12,
  getLayoutStyle13,
  getLayoutStyle14,
  getLayoutStyle15,
} from './CalendarScreen.modals.layout-styles';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { FileText, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import { formatCalendarDate, calendarEventColor } from './calendar-screen.utils';
import { workoutStatusLines } from './calendar-workout-label';
import { Button, EmptyState, IconButton, Modal, colors as tk } from '@trainerpro/ui';
const VARIANT_SECONDARY = 'secondary' as const;
const TONE_DANGER = 'danger' as const;
export { AddNoteModal, AddReminderModal } from './CalendarScreen.modals.forms';
const MODAL_SIZE = 'md' as const;
const TIME_ICON = '⏰ ' as const;
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
        <EmptyState icon={<FileText color={tk.border} size={32} />} title={t('coach.calendar.empty')} />
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
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3;
  const layoutStyle4 = getLayoutStyle4;
  return (
    <Modal closeLabel={t('common.close')} onClose={onClose} size={MODAL_SIZE} title={formatCalendarDate(date)} visible>
      <Text style={layoutStyle1}>
        {dayEvents.length} {t('coach.calendar.day.events')}
      </Text>
      <View style={layoutStyle2}>
        <Button
          icon={<StickyNote color={tk.primary} size={15} />}
          label={t('coach.calendar.day.addNote')}
          onPress={onAddNote}
          style={layoutStyle3}
          variant={VARIANT_SECONDARY}
        />
        <Button
          icon={<Plus color={tk.primary} size={15} />}
          label={t('coach.calendar.day.addReminder')}
          onPress={onAddReminder}
          style={layoutStyle4}
          variant={VARIANT_SECONDARY}
        />
      </View>
      <DayEventList dayEvents={dayEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} t={t} />
    </Modal>
  );
}
type EventRowProps = {
  event: CalendarEventData;
  onDelete: () => void;
  onEdit?: () => void;
  t: TFunc;
};
function EventRow({ event, onDelete, onEdit, t }: EventRowProps): React.JSX.Element {
  const { i18n } = useTranslation();
  const colorObj = calendarEventColor(event);
  const typeLabel = t(`coach.calendar.type.${event.type}`);
  const statusLines = workoutStatusLines(event, t, i18n.language);
  const layoutStyle5 = getLayoutStyle5(colorObj.border, colorObj.bg);
  const layoutStyle6 = getLayoutStyle6;
  const layoutStyle7 = getLayoutStyle7;
  const layoutStyle8 = getLayoutStyle8(colorObj.text);
  const layoutStyle9 = getLayoutStyle9(colorObj.text);
  const layoutStyle10 = getLayoutStyle10(colorObj.text);
  const layoutStyle11 = getLayoutStyle11(colorObj.text);
  const layoutStyle12 = getLayoutStyle12(colorObj.text);
  const layoutStyle13 = getLayoutStyle13(colorObj.text);
  const layoutStyle15 = getLayoutStyle14;
  return (
    <View style={layoutStyle5}>
      <View style={layoutStyle6}>
        <View style={layoutStyle7}>
          <Text style={layoutStyle8}>{typeLabel}</Text>
          {event.clientName && <Text style={layoutStyle9}>{event.clientName}</Text>}
          {event.time && (
            <Text style={layoutStyle10}>
              {TIME_ICON}
              {event.time}
            </Text>
          )}
        </View>
        {event.title && <Text style={layoutStyle11}>{event.title}</Text>}
        {event.planDayTitle && !event.title && <Text style={layoutStyle12}>{event.planDayTitle}</Text>}
        {event.content && <Text style={layoutStyle13}>{event.content}</Text>}
        {statusLines.map((line) => {
          const layoutStyle14 = getLayoutStyle15(colorObj.text);
          return (
            <Text key={line} style={layoutStyle14}>
              {line}
            </Text>
          );
        })}
      </View>
      <View style={layoutStyle15}>
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
