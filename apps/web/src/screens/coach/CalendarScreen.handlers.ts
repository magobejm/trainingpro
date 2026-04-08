import type React from 'react';
import type { useCreateCalendarEventMutation, useUpdateCalendarEventMutation } from '../../data/hooks/useCalendarQuery';
import type { CalendarDragData, CalendarEventData } from './calendar-screen.types';
import type { CalendarClipboard } from './CalendarScreen.week-row';

export type ModalState =
  | { type: 'none' }
  | { type: 'day'; dateStr: string }
  | { type: 'addNote'; dateStr: string }
  | { type: 'addReminder'; dateStr: string }
  | { type: 'editNote'; event: CalendarEventData; dateStr: string }
  | { type: 'editReminder'; event: CalendarEventData; dateStr: string };

export function toIso(d: Date | string): string {
  return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);
}

export function filterDayEvents(events: CalendarEventData[], modal: ModalState): CalendarEventData[] {
  if (modal.type !== 'day') return [];
  return events.filter((ev) => toIso(ev.date) === modal.dateStr);
}

export function moveToPrevMonth(
  month: number,
  setMonth: React.Dispatch<React.SetStateAction<number>>,
  setYear: React.Dispatch<React.SetStateAction<number>>,
) {
  if (month === 0) {
    setMonth(11);
    setYear((y) => y - 1);
    return;
  }
  setMonth((v) => v - 1);
}

export function moveToNextMonth(
  month: number,
  setMonth: React.Dispatch<React.SetStateAction<number>>,
  setYear: React.Dispatch<React.SetStateAction<number>>,
) {
  if (month === 11) {
    setMonth(0);
    setYear((y) => y + 1);
    return;
  }
  setMonth((v) => v + 1);
}

export function createDropHandler(
  createEvent: ReturnType<typeof useCreateCalendarEventMutation>,
  clientId: string | undefined,
) {
  return (data: CalendarDragData, dateStr: string) => {
    createEvent.mutate({
      type: 'workout',
      date: dateStr,
      title: data.planDayTitle,
      color: data.color,
      clientId,
      planDayId: data.planDayId,
    });
  };
}

export function createNoteSaveHandler(
  createEvent: ReturnType<typeof useCreateCalendarEventMutation>,
  modal: ModalState,
  selectedClientId: string | undefined,
  setModal: React.Dispatch<React.SetStateAction<ModalState>>,
) {
  return (data: { title: string; content: string; color: string }) => {
    if (modal.type !== 'addNote') return;
    createEvent.mutate(
      {
        type: 'note',
        date: modal.dateStr,
        title: data.title || undefined,
        content: data.content || undefined,
        color: data.color,
        clientId: selectedClientId,
      },
      { onSuccess: () => setModal({ type: 'day', dateStr: modal.dateStr }) },
    );
  };
}

export function createReminderSaveHandler(
  createEvent: ReturnType<typeof useCreateCalendarEventMutation>,
  modal: ModalState,
  selectedClientId: string | undefined,
  setModal: React.Dispatch<React.SetStateAction<ModalState>>,
) {
  return (data: { content: string; time: string; color: string }) => {
    if (modal.type !== 'addReminder') return;
    createEvent.mutate(
      {
        type: 'reminder',
        date: modal.dateStr,
        content: data.content || undefined,
        time: data.time || undefined,
        color: data.color,
        clientId: selectedClientId,
      },
      { onSuccess: () => setModal({ type: 'day', dateStr: modal.dateStr }) },
    );
  };
}

export function createNoteUpdateHandler(
  updateEvent: ReturnType<typeof useUpdateCalendarEventMutation>,
  modal: ModalState,
  setModal: React.Dispatch<React.SetStateAction<ModalState>>,
) {
  return (data: { title: string; content: string; color: string }) => {
    if (modal.type !== 'editNote') return;
    updateEvent.mutate(
      {
        eventId: modal.event.id,
        input: { title: data.title || undefined, content: data.content || undefined, color: data.color },
      },
      { onSuccess: () => setModal({ type: 'day', dateStr: modal.dateStr }) },
    );
  };
}

export function createReminderUpdateHandler(
  updateEvent: ReturnType<typeof useUpdateCalendarEventMutation>,
  modal: ModalState,
  setModal: React.Dispatch<React.SetStateAction<ModalState>>,
) {
  return (data: { content: string; time: string; color: string }) => {
    if (modal.type !== 'editReminder') return;
    updateEvent.mutate(
      {
        eventId: modal.event.id,
        input: { content: data.content || undefined, time: data.time || undefined, color: data.color },
      },
      { onSuccess: () => setModal({ type: 'day', dateStr: modal.dateStr }) },
    );
  };
}

export function createEditEventHandler(setModal: React.Dispatch<React.SetStateAction<ModalState>>) {
  return (event: CalendarEventData) => {
    const dateStr = toIso(event.date);
    if (event.type === 'note') setModal({ type: 'editNote', event, dateStr });
    else if (event.type === 'reminder') setModal({ type: 'editReminder', event, dateStr });
  };
}

export function createWeekMoveHandler(
  updateEvent: ReturnType<typeof useUpdateCalendarEventMutation>,
  events: CalendarEventData[],
) {
  return (sourceDates: string[], targetDates: string[]) => {
    for (let i = 0; i < 7; i++) {
      const src = sourceDates[i];
      const tgt = targetDates[i];
      if (!src || !tgt || src === tgt) continue;
      for (const ev of events.filter((e) => toIso(e.date) === src)) {
        updateEvent.mutate({ eventId: ev.id, input: { date: tgt } });
      }
    }
  };
}

export function createCopyPasteHandlers(
  createEvent: ReturnType<typeof useCreateCalendarEventMutation>,
  clipboard: CalendarClipboard | null,
  setClipboard: React.Dispatch<React.SetStateAction<CalendarClipboard | null>>,
  events: CalendarEventData[],
) {
  function handleCopyWeek(dates: string[]) {
    setClipboard({ type: 'week', sourceDates: dates, events: events.filter((ev) => dates.includes(toIso(ev.date))) });
  }
  function handleCopyDay(dateStr: string) {
    setClipboard({ type: 'day', sourceDate: dateStr, events: events.filter((ev) => toIso(ev.date) === dateStr) });
  }
  function handlePasteWeek(targetDates: string[]) {
    if (!clipboard || clipboard.type !== 'week') return;
    for (let i = 0; i < 7; i++) {
      const src = clipboard.sourceDates[i];
      const tgt = targetDates[i];
      if (!src || !tgt) continue;
      for (const ev of clipboard.events.filter((e) => toIso(e.date) === src)) {
        createEvent.mutate({
          type: ev.type,
          date: tgt,
          title: ev.title ?? undefined,
          content: ev.content ?? undefined,
          time: ev.time ?? undefined,
          color: ev.color ?? undefined,
          clientId: ev.clientId ?? undefined,
          planDayId: ev.planDayId ?? undefined,
        });
      }
    }
  }
  function handlePasteDay(targetDateStr: string) {
    if (!clipboard || clipboard.type !== 'day') return;
    for (const ev of clipboard.events) {
      createEvent.mutate({
        type: ev.type,
        date: targetDateStr,
        title: ev.title ?? undefined,
        content: ev.content ?? undefined,
        time: ev.time ?? undefined,
        color: ev.color ?? undefined,
        clientId: ev.clientId ?? undefined,
        planDayId: ev.planDayId ?? undefined,
      });
    }
  }
  return { handleCopyWeek, handleCopyDay, handlePasteWeek, handlePasteDay };
}
