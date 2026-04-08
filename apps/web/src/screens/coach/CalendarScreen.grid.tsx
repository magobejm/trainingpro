import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { CalendarEventData, CalendarDragData } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';
import type { CalendarCell } from './calendar-screen.utils';
import { getWeeks, DAY_NAMES_ES, MONTH_NAMES_ES } from './calendar-screen.utils';

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
  onGoTo: (year: number, month: number) => void;
  onDayClick: (dateStr: string) => void;
  onDrop: (data: CalendarDragData, dateStr: string) => void;
  onMoveEvent: (eventId: string, newDateStr: string) => void;
  onMoveWeek: (sourceDates: string[], targetDates: string[]) => void;
  t: TFunc;
};

type DayCellProps = {
  cell: CalendarCell;
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
    if (e.dataTransfer.types.includes('weekdates')) return; // WeekRow handles it
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
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isCurrentMonth && isToday ? colors.primary : 'transparent',
          marginBottom: 2,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: isCurrentMonth && isToday ? 'bold' : 'normal', color: dayColor }}>
          {cell.day}
        </span>
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

type MonthHeaderProps = {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoTo: (year: number, month: number) => void;
};

function MonthPicker({
  currentYear,
  currentMonth,
  anchorTop,
  anchorLeft,
  onGoTo,
  onClose,
}: {
  currentYear: number;
  currentMonth: number;
  anchorTop: number;
  anchorLeft: number;
  onGoTo: (year: number, month: number) => void;
  onClose: () => void;
}): React.JSX.Element {
  const [pickerYear, setPickerYear] = useState(currentYear);
  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
      <div
        style={{
          position: 'fixed',
          top: anchorTop,
          left: anchorLeft,
          zIndex: 1000,
          backgroundColor: 'white',
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 16,
          minWidth: 240,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPickerYear((y) => y - 1);
            }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 12px', fontSize: 18 }}
          >
            {'‹'}
          </button>
          <span style={{ fontWeight: 'bold', fontSize: 15, color: colors.text }}>{pickerYear}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPickerYear((y) => y + 1);
            }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 12px', fontSize: 18 }}
          >
            {'›'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {MONTH_NAMES_ES.map((name, i) => {
            const isSelected = pickerYear === currentYear && i === currentMonth;
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onGoTo(pickerYear, i);
                  onClose();
                }}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 4px',
                  fontSize: 12,
                  fontWeight: isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  color: isSelected ? 'white' : colors.text,
                }}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}

function CalendarMonthHeader({ year, month, onPrevMonth, onNextMonth, onGoTo }: MonthHeaderProps): React.JSX.Element {
  const [showPicker, setShowPicker] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  function handleTitleClick() {
    if (titleRef.current) {
      const rect = titleRef.current.getBoundingClientRect();
      setAnchor({ top: rect.bottom + 4, left: rect.left });
    }
    setShowPicker((v) => !v);
  }

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
      <div ref={titleRef} onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          {MONTH_NAMES_ES[month]} {year}
        </Text>
      </div>
      {showPicker && anchor && (
        <MonthPicker
          currentYear={year}
          currentMonth={month}
          anchorTop={anchor.top}
          anchorLeft={anchor.left}
          onGoTo={onGoTo}
          onClose={() => setShowPicker(false)}
        />
      )}
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
      <View style={{ width: 20, flexShrink: 0 }} />
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

type WeekRowProps = {
  cells: CalendarCell[];
  todayStr: string;
  eventsByDate: Record<string, CalendarEventData[]>;
  onDayClick: (dateStr: string) => void;
  onCellDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onCellDrop: (e: React.DragEvent<HTMLDivElement>, dateStr: string) => void;
  onMoveWeek: (src: string[], tgt: string[]) => void;
  t: TFunc;
};

function WeekRow({
  cells,
  todayStr,
  eventsByDate,
  onDayClick,
  onCellDragOver,
  onCellDrop,
  onMoveWeek,
  t,
}: WeekRowProps): React.JSX.Element {
  const [isWeekDragOver, setIsWeekDragOver] = useState(false);

  function handleGripDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('weekDates', JSON.stringify(cells.map((c) => c.dateStr)));
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleWeekDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes('weekdates')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsWeekDragOver(true);
  }
  function handleWeekDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsWeekDragOver(false);
  }
  function handleWeekDrop(e: React.DragEvent<HTMLDivElement>) {
    setIsWeekDragOver(false);
    const raw = e.dataTransfer.getData('weekDates');
    if (!raw) return;
    e.preventDefault();
    e.stopPropagation();
    onMoveWeek(
      JSON.parse(raw) as string[],
      cells.map((c) => c.dateStr),
    );
  }

  return (
    <div
      onDragOver={handleWeekDragOver}
      onDragLeave={handleWeekDragLeave}
      onDrop={handleWeekDrop}
      style={{
        display: 'flex',
        outline: isWeekDragOver ? '2px solid #3b82f6' : '2px solid transparent',
        outlineOffset: '-2px',
        transition: 'outline 0.1s',
      }}
    >
      <div
        draggable
        onDragStart={handleGripDragStart}
        title={t('coach.calendar.week.dragHandle')}
        style={{
          width: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          flexShrink: 0,
          backgroundColor: isWeekDragOver ? '#eff6ff' : '#fafafa',
          borderRight: '1px solid #e2e8f0',
        }}
      >
        <GripVertical size={12} color={colors.textMuted} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, minWidth: 0 }}>
        {cells.map((cell, i) => {
          const dayEvents = eventsByDate[cell.dateStr] ?? [];
          return (
            <CalendarDayCell
              key={i}
              cell={cell}
              isToday={cell.dateStr === todayStr}
              dayEvents={dayEvents}
              onDayClick={() => onDayClick(cell.dateStr)}
              onDragOver={onCellDragOver}
              onDrop={(e) => onCellDrop(e, cell.dateStr)}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CalendarGrid({
  year,
  month,
  events,
  onPrevMonth,
  onNextMonth,
  onGoTo,
  onDayClick,
  onDrop,
  onMoveEvent,
  onMoveWeek,
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
      <CalendarMonthHeader year={year} month={month} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} onGoTo={onGoTo} />
      <CalendarDayNames />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {weeks.map((week, weekIdx) => (
          <WeekRow
            key={weekIdx}
            cells={week}
            todayStr={todayStr}
            eventsByDate={eventsByDate}
            onDayClick={onDayClick}
            onCellDragOver={handleCellDragOver}
            onCellDrop={handleCellDrop}
            onMoveWeek={onMoveWeek}
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
