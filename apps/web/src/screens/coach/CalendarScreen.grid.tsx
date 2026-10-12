import { calendarEventColor } from './calendar-screen.utils';
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
} from './CalendarScreen.grid.layout-styles';

import { WebBox, WebText } from '@trainerpro/ui';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ClipboardPaste, Copy } from 'lucide-react';
import type { CalendarEventData, CalendarDragData } from './calendar-screen.types';

import { callStatusLabelKey } from './calendar-fixed-colors';
import type { CalendarCell } from './calendar-screen.utils';
import { getWeeks } from './calendar-screen.utils';
import type { CalendarClipboard } from './CalendarScreen.week-row';
import { WeekRow } from './CalendarScreen.week-row';
import { CalendarMonthHeader, CalendarDayNames } from './CalendarScreen.month-header';
import { workoutStatusLines } from './calendar-workout-label';
import { colors as tk } from '@trainerpro/ui';
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
type GridProps = {
  year: number;
  month: number;
  events: CalendarEventData[];
  clipboard: CalendarClipboard | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoTo: (year: number, month: number) => void;
  onDayClick: (dateStr: string) => void;
  onDrop: (data: CalendarDragData, dateStr: string) => void;
  onMoveEvent: (eventId: string, newDateStr: string) => void;
  onMoveWeek: (sourceDates: string[], targetDates: string[]) => void;
  onCopyWeek: (dates: string[]) => void;
  onPasteWeek: (targetDates: string[]) => void;
  onCopyDay: (dateStr: string) => void;
  onPasteDay: (dateStr: string) => void;
  onClearClipboard: () => void;
  t: TFunc;
};
function DayCellCopyAction({
  show,
  canPaste,
  dateStr,
  onCopy,
  onPaste,
  t,
}: {
  show: boolean;
  canPaste: boolean;
  dateStr: string;
  onCopy: (d: string) => void;
  onPaste: (d: string) => void;
  t: TFunc;
}): React.JSX.Element | null {
  if (!show) return null;
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  return (
    <>
      <WebBox
        onClick={(e) => {
          e.stopPropagation();
          onCopy(dateStr);
        }}
        title={t('coach.calendar.clipboard.copyDay')}
        style={layoutStyle1}
      >
        <Copy size={11} color={tk.textMuted} />
      </WebBox>
      {canPaste && (
        <WebBox
          onClick={(e) => {
            e.stopPropagation();
            onPaste(dateStr);
          }}
          title={t('coach.calendar.clipboard.pasteDay')}
          style={layoutStyle2}
        >
          <ClipboardPaste size={11} color={tk.primary} />
        </WebBox>
      )}
    </>
  );
}
type DayCellProps = {
  cell: CalendarCell;
  isToday: boolean;
  dayEvents: CalendarEventData[];
  clipboard: CalendarClipboard | null;
  onDayClick?: () => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onCopyDay: (dateStr: string) => void;
  onPasteDay: (dateStr: string) => void;
  t: TFunc;
};
export function CalendarDayCell({
  cell,
  isToday,
  dayEvents,
  clipboard,
  onDayClick,
  onDragOver,
  onDrop,
  onCopyDay,
  onPasteDay,
  t,
}: DayCellProps): React.JSX.Element {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCellHover, setIsCellHover] = useState(false);
  const visibleEvents = dayEvents.slice(0, 3);
  const overflowCount = dayEvents.length - visibleEvents.length;
  const canPasteDay = clipboard?.type === 'day';
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes('weekdates')) {
      e.preventDefault();
      return;
    }
    onDragOver?.(e);
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes('weekdates')) return;
    setIsDragOver(false);
    onDrop?.(e);
  }
  const { isCurrentMonth } = cell;
  const bgColor = !isCurrentMonth ? tk.surfaceMuted : isDragOver ? tk.primaryBorder : isToday ? tk.primarySoft : tk.surface;
  const dayColor = !isCurrentMonth ? tk.borderStrong : isToday ? tk.surface : tk.text;
  const layoutStyle3 = getLayoutStyle3(bgColor, onDayClick ? 'pointer' : 'default');
  const layoutStyle4 = getLayoutStyle4;
  const layoutStyle5 = getLayoutStyle5(isCurrentMonth && isToday ? tk.primary : 'transparent');
  const layoutStyle6 = getLayoutStyle6(isCurrentMonth && isToday ? 'bold' : 'normal', dayColor);
  const layoutStyle7 = getLayoutStyle7;
  const layoutStyle8 = getLayoutStyle8;
  return (
    <WebBox
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsCellHover(true)}
      onMouseLeave={() => setIsCellHover(false)}
      onClick={onDayClick}
      style={layoutStyle3}
    >
      <WebBox style={layoutStyle4}>
        <WebBox style={layoutStyle5}>
          <WebText style={layoutStyle6}>{cell.day}</WebText>
        </WebBox>
        <DayCellCopyAction
          show={isCellHover && isCurrentMonth}
          canPaste={canPasteDay}
          dateStr={cell.dateStr}
          onCopy={onCopyDay}
          onPaste={onPasteDay}
          t={t}
        />
      </WebBox>
      <WebBox style={layoutStyle7}>
        {visibleEvents.map((ev) => (
          <EventChip key={ev.id} event={ev} muted={!isCurrentMonth} />
        ))}
        {overflowCount > 0 && (
          <WebText style={layoutStyle8}>{t('coach.calendar.grid.more', { count: overflowCount })}</WebText>
        )}
      </WebBox>
    </WebBox>
  );
}
export function CalendarGrid({
  year,
  month,
  events,
  clipboard,
  onPrevMonth,
  onNextMonth,
  onGoTo,
  onDayClick,
  onDrop,
  onMoveEvent,
  onMoveWeek,
  onCopyWeek,
  onPasteWeek,
  onCopyDay,
  onPasteDay,
  onClearClipboard,
  t,
}: GridProps): React.JSX.Element {
  const weeks = getWeeks(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const eventsByDate = events.reduce<Record<string, CalendarEventData[]>>((acc, ev) => {
    const d = ev.date instanceof Date ? ev.date : new Date(ev.date);
    const key = d.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});
  const handleCellDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  const handleCellDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
      e.preventDefault();
      const calendarEventId = e.dataTransfer.getData('calendarEventId');
      if (calendarEventId) {
        onMoveEvent(calendarEventId, dateStr);
        return;
      }
      const planDayId = e.dataTransfer.getData('planDayId');
      const planDayTitle = e.dataTransfer.getData('planDayTitle');
      const clientId = e.dataTransfer.getData('clientId');
      const color = e.dataTransfer.getData('color');
      if (!planDayId || !dateStr) return;
      onDrop({ planDayId, planDayTitle, clientId, color }, dateStr);
    },
    [onDrop, onMoveEvent],
  );
  const layoutStyle9 = getLayoutStyle9;
  const layoutStyle10 = getLayoutStyle10;
  return (
    <View style={layoutStyle9}>
      <CalendarMonthHeader
        year={year}
        month={month}
        clipboard={clipboard}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onGoTo={onGoTo}
        onClearClipboard={onClearClipboard}
        t={t}
      />
      <CalendarDayNames />
      <WebBox style={layoutStyle10}>
        {weeks.map((week, weekIdx) => (
          <WeekRow
            key={weekIdx}
            cells={week}
            todayStr={todayStr}
            eventsByDate={eventsByDate}
            clipboard={clipboard}
            onDayClick={onDayClick}
            onCellDragOver={handleCellDragOver}
            onCellDrop={handleCellDrop}
            onMoveWeek={onMoveWeek}
            onCopyWeek={onCopyWeek}
            onPasteWeek={onPasteWeek}
            onCopyDay={onCopyDay}
            onPasteDay={onPasteDay}
            t={t}
          />
        ))}
      </WebBox>
    </View>
  );
}
function EventChip({ event, muted = false }: { event: CalendarEventData; muted?: boolean }): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const colorObj = calendarEventColor(event);
  const statusKey = callStatusLabelKey(event.callStatus);
  const label =
    (statusKey ? t(statusKey) : null) ??
    event.title ??
    event.planDayTitle ??
    (event.type === 'reminder' ? event.content : null) ??
    '—';
  const displayText = event.time ? [event.time, label].join(' ') : label;
  const statusLines = workoutStatusLines(event, t, i18n.language);
  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.dataTransfer.setData('calendarEventId', event.id);
    e.dataTransfer.effectAllowed = 'move';
  }
  const layoutStyle11 = getLayoutStyle11(
    colorObj.bg,
    colorObj.text,
    `${event.callStatus === 'pending' ? '1px dashed' : '1px solid'} ${colorObj.border}`,
    event.type === 'physical_test' ? 'default' : 'grab',
    muted ? 0.5 : 1,
  );
  const layoutStyle12 = getLayoutStyle12;
  return (
    <WebBox
      draggable={event.type !== 'physical_test'}
      onDragStart={event.type === 'physical_test' ? undefined : handleDragStart}
      style={layoutStyle11}
    >
      <WebBox style={layoutStyle12}>{displayText}</WebBox>
      {statusLines.map((line) => {
        const layoutStyle13 = getLayoutStyle13;
        return (
          <WebBox key={line} style={layoutStyle13}>
            {line}
          </WebBox>
        );
      })}
    </WebBox>
  );
}
