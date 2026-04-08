import React, { useState } from 'react';
import { ClipboardPaste, Copy, GripVertical } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import type { CalendarCell } from './calendar-screen.utils';
import { CalendarDayCell } from './CalendarScreen.grid';

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

export type CalendarClipboard =
  | { type: 'week'; sourceDates: string[]; events: CalendarEventData[] }
  | { type: 'day'; sourceDate: string; events: CalendarEventData[] };

const colors = {
  primary: '#3b82f6',
  textMuted: '#64748b',
};

function WeekGripHandle({
  isWeekDragOver,
  canPasteWeek,
  weekDates,
  onDragStart,
  onCopyWeek,
  onPasteWeek,
  t,
}: {
  isWeekDragOver: boolean;
  canPasteWeek: boolean;
  weekDates: string[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onCopyWeek: (d: string[]) => void;
  onPasteWeek: (d: string[]) => void;
  t: TFunc;
}): React.JSX.Element {
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      title={t('coach.calendar.week.dragHandle')}
      style={{
        width: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        cursor: 'grab',
        flexShrink: 0,
        backgroundColor: isWeekDragOver ? '#eff6ff' : '#fafafa',
        borderRight: '1px solid #e2e8f0',
      }}
    >
      <GripVertical size={12} color={colors.textMuted} />
      {isHover && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onCopyWeek(weekDates);
          }}
          title={t('coach.calendar.clipboard.copyWeek')}
          style={{ cursor: 'pointer', lineHeight: 0 }}
        >
          <Copy size={11} color={colors.primary} />
        </div>
      )}
      {isHover && canPasteWeek && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPasteWeek(weekDates);
          }}
          title={t('coach.calendar.clipboard.pasteWeek')}
          style={{ cursor: 'pointer', lineHeight: 0 }}
        >
          <ClipboardPaste size={11} color={colors.primary} />
        </div>
      )}
    </div>
  );
}

type WeekRowProps = {
  cells: CalendarCell[];
  todayStr: string;
  eventsByDate: Record<string, CalendarEventData[]>;
  clipboard: CalendarClipboard | null;
  onDayClick: (dateStr: string) => void;
  onCellDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onCellDrop: (e: React.DragEvent<HTMLDivElement>, dateStr: string) => void;
  onMoveWeek: (src: string[], tgt: string[]) => void;
  onCopyWeek: (dates: string[]) => void;
  onPasteWeek: (targetDates: string[]) => void;
  onCopyDay: (dateStr: string) => void;
  onPasteDay: (dateStr: string) => void;
  t: TFunc;
};

export function WeekRow({
  cells,
  todayStr,
  eventsByDate,
  clipboard,
  onDayClick,
  onCellDragOver,
  onCellDrop,
  onMoveWeek,
  onCopyWeek,
  onPasteWeek,
  onCopyDay,
  onPasteDay,
  t,
}: WeekRowProps): React.JSX.Element {
  const [isWeekDragOver, setIsWeekDragOver] = useState(false);
  const weekDates = cells.map((c) => c.dateStr);
  const canPasteWeek = clipboard?.type === 'week';

  function handleGripDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('weekDates', JSON.stringify(weekDates));
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
    onMoveWeek(JSON.parse(raw) as string[], weekDates);
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
      <WeekGripHandle
        isWeekDragOver={isWeekDragOver}
        canPasteWeek={canPasteWeek}
        weekDates={weekDates}
        onDragStart={handleGripDragStart}
        onCopyWeek={onCopyWeek}
        onPasteWeek={onPasteWeek}
        t={t}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, minWidth: 0 }}>
        {cells.map((cell, i) => {
          const dayEvents = eventsByDate[cell.dateStr] ?? [];
          return (
            <CalendarDayCell
              key={i}
              cell={cell}
              isToday={cell.dateStr === todayStr}
              dayEvents={dayEvents}
              clipboard={clipboard}
              onDayClick={() => onDayClick(cell.dateStr)}
              onDragOver={onCellDragOver}
              onDrop={(e) => onCellDrop(e, cell.dateStr)}
              onCopyDay={onCopyDay}
              onPasteDay={onPasteDay}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
