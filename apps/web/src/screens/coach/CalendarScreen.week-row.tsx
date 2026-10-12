import {
  getLayoutStyle1,
  getLayoutStyle2,
  getLayoutStyle3,
  getLayoutStyle4,
  getLayoutStyle5,
} from './CalendarScreen.week-row.layout-styles';
import { WebBox } from '@trainerpro/ui';
import React, { useState } from 'react';
import { ClipboardPaste, Copy, GripVertical } from 'lucide-react';
import type { CalendarEventData } from './calendar-screen.types';
import type { CalendarCell } from './calendar-screen.utils';
import { CalendarDayCell } from './CalendarScreen.grid';
import { colors as tk } from '@trainerpro/ui';
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
export type CalendarClipboard =
  | {
      type: 'week';
      sourceDates: string[];
      events: CalendarEventData[];
    }
  | {
      type: 'day';
      sourceDate: string;
      events: CalendarEventData[];
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
  const layoutStyle1 = getLayoutStyle1(isWeekDragOver ? tk.primarySoft : tk.surfaceMuted);
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3;
  return (
    <WebBox
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      title={t('coach.calendar.week.dragHandle')}
      style={layoutStyle1}
    >
      <GripVertical size={12} color={tk.textMuted} />
      {isHover && (
        <WebBox
          onClick={(e) => {
            e.stopPropagation();
            onCopyWeek(weekDates);
          }}
          title={t('coach.calendar.clipboard.copyWeek')}
          style={layoutStyle2}
        >
          <Copy size={11} color={tk.primary} />
        </WebBox>
      )}
      {isHover && canPasteWeek && (
        <WebBox
          onClick={(e) => {
            e.stopPropagation();
            onPasteWeek(weekDates);
          }}
          title={t('coach.calendar.clipboard.pasteWeek')}
          style={layoutStyle3}
        >
          <ClipboardPaste size={11} color={tk.primary} />
        </WebBox>
      )}
    </WebBox>
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
  const layoutStyle4 = getLayoutStyle4(isWeekDragOver ? `2px solid ${tk.primary}` : '2px solid transparent');
  const layoutStyle5 = getLayoutStyle5;
  return (
    <WebBox onDragOver={handleWeekDragOver} onDragLeave={handleWeekDragLeave} onDrop={handleWeekDrop} style={layoutStyle4}>
      <WeekGripHandle
        isWeekDragOver={isWeekDragOver}
        canPasteWeek={canPasteWeek}
        weekDates={weekDates}
        onDragStart={handleGripDragStart}
        onCopyWeek={onCopyWeek}
        onPasteWeek={onPasteWeek}
        t={t}
      />
      <WebBox style={layoutStyle5}>
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
      </WebBox>
    </WebBox>
  );
}
