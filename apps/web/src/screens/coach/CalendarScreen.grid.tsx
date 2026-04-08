import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ClipboardPaste, Copy } from 'lucide-react';
import type { CalendarEventData, CalendarDragData } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';
import type { CalendarCell } from './calendar-screen.utils';
import { getWeeks } from './calendar-screen.utils';
import type { CalendarClipboard } from './CalendarScreen.week-row';
import { WeekRow } from './CalendarScreen.week-row';
import { CalendarMonthHeader, CalendarDayNames } from './CalendarScreen.month-header';

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

const colors = {
  primary: '#3b82f6',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
  today: '#eff6ff',
};

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
  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onCopy(dateStr);
        }}
        title={t('coach.calendar.clipboard.copyDay')}
        style={{ cursor: 'pointer', lineHeight: 0 }}
      >
        <Copy size={11} color={colors.textMuted} />
      </div>
      {canPaste && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPaste(dateStr);
          }}
          title={t('coach.calendar.clipboard.pasteDay')}
          style={{ cursor: 'pointer', lineHeight: 0 }}
        >
          <ClipboardPaste size={11} color={colors.primary} />
        </div>
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
  const bgColor = !isCurrentMonth ? colors.bg : isDragOver ? '#dbeafe' : isToday ? colors.today : 'white';
  const dayColor = !isCurrentMonth ? '#b0bec5' : isToday ? 'white' : colors.text;
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsCellHover(true)}
      onMouseLeave={() => setIsCellHover(false)}
      onClick={onDayClick}
      style={{
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        minHeight: 110,
        padding: '6px 4px',
        backgroundColor: bgColor,
        cursor: onDayClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background-color 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isCurrentMonth && isToday ? colors.primary : 'transparent',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: isCurrentMonth && isToday ? 'bold' : 'normal', color: dayColor }}>
            {cell.day}
          </span>
        </div>
        <DayCellCopyAction
          show={isCellHover && isCurrentMonth}
          canPaste={canPasteDay}
          dateStr={cell.dateStr}
          onCopy={onCopyDay}
          onPaste={onPasteDay}
          t={t}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibleEvents.map((ev) => (
          <EventChip key={ev.id} event={ev} muted={!isCurrentMonth} />
        ))}
        {overflowCount > 0 && (
          <span style={{ fontSize: 10, color: colors.textMuted, paddingLeft: 4 }}>
            {t('coach.calendar.grid.more', { count: overflowCount })}
          </span>
        )}
      </div>
    </div>
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

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: 'white', minWidth: 0 }}>
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
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
      </div>
    </View>
  );
}

function EventChip({ event, muted = false }: { event: CalendarEventData; muted?: boolean }): React.JSX.Element {
  const colorObj = (CALENDAR_COLORS.find((c) => c.bg === event.color) ?? CALENDAR_COLORS[0])!;
  const label = event.title ?? event.planDayTitle ?? (event.type === 'reminder' ? event.content : null) ?? '—';
  const displayText = event.time ? [event.time, label].join(' ') : label;

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.dataTransfer.setData('calendarEventId', event.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        backgroundColor: colorObj.bg,
        color: colorObj.text,
        border: `1px solid ${colorObj.border}`,
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 13,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        cursor: 'grab',
        opacity: muted ? 0.5 : 1,
      }}
    >
      {displayText}
    </div>
  );
}
