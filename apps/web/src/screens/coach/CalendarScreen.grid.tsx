import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEventData, CalendarDragData } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';
import { getMonthGrid, DAY_NAMES_ES, MONTH_NAMES_ES } from './calendar-screen.utils';

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
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (dateStr: string) => void;
  onDrop: (data: CalendarDragData, dateStr: string) => void;
  onMoveEvent: (eventId: string, newDateStr: string) => void;
  t: TFunc;
};

type DayCellProps = {
  cell: { day: number | null; dateStr?: string | null };
  isToday: boolean;
  dayEvents: CalendarEventData[];
  onDayClick?: () => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  t: TFunc;
};

function CalendarDayCell({ cell, isToday, dayEvents, onDayClick, onDragOver, onDrop, t }: DayCellProps): React.JSX.Element {
  const [isDragOver, setIsDragOver] = useState(false);
  const visibleEvents = dayEvents.slice(0, 3);
  const overflowCount = dayEvents.length - visibleEvents.length;

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    onDragOver?.(e);
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    setIsDragOver(false);
    onDrop?.(e);
  }

  const bgColor = cell.day === null ? '#fafafa' : isDragOver ? '#dbeafe' : isToday ? colors.today : 'white';
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onDayClick}
      style={{
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        minHeight: 110,
        padding: '6px 4px',
        backgroundColor: bgColor,
        cursor: cell.dateStr ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background-color 0.1s',
      }}
    >
      {cell.day !== null && (
        <>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isToday ? colors.primary : 'transparent',
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: isToday ? 'bold' : 'normal', color: isToday ? 'white' : colors.text }}>
              {cell.day}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {visibleEvents.map((ev) => (
              <EventChip key={ev.id} event={ev} />
            ))}
            {overflowCount > 0 && (
              <span style={{ fontSize: 10, color: colors.textMuted, paddingLeft: 4 }}>
                {t('coach.calendar.grid.more', { count: overflowCount })}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type MonthHeaderProps = { year: number; month: number; onPrevMonth: () => void; onNextMonth: () => void };

function CalendarMonthHeader({ year, month, onPrevMonth, onNextMonth }: MonthHeaderProps): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderColor: colors.border,
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
        {MONTH_NAMES_ES[month]} {year}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onPrevMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
          }}
        >
          <ChevronLeft color={colors.textMuted} size={16} />
        </Pressable>
        <Pressable
          onPress={onNextMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
          }}
        >
          <ChevronRight color={colors.textMuted} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

function CalendarDayNames(): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, flexShrink: 0 }}>
      {DAY_NAMES_ES.map((dayName) => (
        <View key={dayName} style={{ flex: 1, paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.textMuted, letterSpacing: 0.5 }}>
            {dayName.slice(0, 3)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function CalendarGrid({
  year,
  month,
  events,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onDrop,
  onMoveEvent,
  t,
}: GridProps): React.JSX.Element {
  const cells = getMonthGrid(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const eventsByDate = events.reduce<Record<string, CalendarEventData[]>>((acc, ev) => {
    const d = ev.date instanceof Date ? ev.date : new Date(ev.date);
    const key = d.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
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
      <CalendarMonthHeader year={year} month={month} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />
      <CalendarDayNames />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '100%' }}>
          {cells.map((cell, i) => {
            const dayEvents = cell.dateStr ? (eventsByDate[cell.dateStr] ?? []) : [];
            const isToday = cell.dateStr === todayStr;
            return (
              <CalendarDayCell
                key={i}
                cell={cell}
                isToday={isToday}
                dayEvents={dayEvents}
                onDayClick={cell.dateStr ? () => onDayClick(cell.dateStr!) : undefined}
                onDragOver={cell.dateStr ? handleDragOver : undefined}
                onDrop={cell.dateStr ? (e: React.DragEvent<HTMLDivElement>) => handleDrop(e, cell.dateStr!) : undefined}
                t={t}
              />
            );
          })}
        </div>
      </div>
    </View>
  );
}

function EventChip({ event }: { event: CalendarEventData }): React.JSX.Element {
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
      }}
    >
      {displayText}
    </div>
  );
}
