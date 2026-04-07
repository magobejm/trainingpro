import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useClientsQuery, useClientObjectivesQuery } from '../../data/hooks/useClientsQuery';
import {
  useCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useClientRoutineDaysQuery,
} from '../../data/hooks/useCalendarQuery';
import type { ClientView } from '../../data/hooks/useClientsQuery';
import type { CalendarDragData, CalendarEventData, RoutineDayCard } from './calendar-screen.types';
import { DEFAULT_COLOR } from './calendar-screen.types';
import { monthRangeDates } from './calendar-screen.utils';
import { CalendarSidebar } from './CalendarScreen.sidebar';
import { CalendarGrid } from './CalendarScreen.grid';
import { DayDetailModal, AddNoteModal, AddReminderModal } from './CalendarScreen.modals';

const COLOR_PRIMARY = '#3b82f6' as const;

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

type ModalState =
  | { type: 'none' }
  | { type: 'day'; dateStr: string }
  | { type: 'addNote'; dateStr: string }
  | { type: 'addReminder'; dateStr: string }
  | { type: 'editNote'; event: CalendarEventData; dateStr: string }
  | { type: 'editReminder'; event: CalendarEventData; dateStr: string };

function filterDayEvents(events: CalendarEventData[], modal: ModalState): CalendarEventData[] {
  if (modal.type !== 'day') return [];
  const dateStr = modal.dateStr;
  return events.filter((event) => {
    const date = event.date instanceof Date ? event.date : new Date(event.date);
    return date.toISOString().slice(0, 10) === dateStr;
  });
}

function moveToPrevMonth(
  month: number,
  setMonth: React.Dispatch<React.SetStateAction<number>>,
  setYear: React.Dispatch<React.SetStateAction<number>>,
) {
  if (month === 0) {
    setMonth(11);
    setYear((year) => year - 1);
    return;
  }
  setMonth((value) => value - 1);
}

function moveToNextMonth(
  month: number,
  setMonth: React.Dispatch<React.SetStateAction<number>>,
  setYear: React.Dispatch<React.SetStateAction<number>>,
) {
  if (month === 11) {
    setMonth(0);
    setYear((year) => year + 1);
    return;
  }
  setMonth((value) => value + 1);
}

function createNoteSaveHandler(
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

function createReminderSaveHandler(
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

function createNoteUpdateHandler(
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

function createReminderUpdateHandler(
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

function useCalendarLogic() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  /** Store only id so routine/trainingPlanId updates when the clients list refetches. */
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [routineDayColors, setRoutineDayColors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const { dateFrom, dateTo } = monthRangeDates(year, month);
  const clientsQuery = useClientsQuery();
  const objectivesQuery = useClientObjectivesQuery();
  const clients = clientsQuery.data ?? [];
  const selectedClient = useMemo(
    () => (selectedClientId ? (clients.find((c) => c.id === selectedClientId) ?? null) : null),
    [clients, selectedClientId],
  );
  const setSelectedClient = useCallback((client: ClientView | null) => {
    setSelectedClientId(client?.id ?? null);
  }, []);
  const planTemplateIdForRoutine = selectedClient?.trainingPlanId ?? selectedClient?.trainingPlan?.id ?? null;
  const eventsQuery = useCalendarEventsQuery(dateFrom, dateTo, selectedClient?.id);
  const routineDaysQuery = useClientRoutineDaysQuery(planTemplateIdForRoutine);
  const createEvent = useCreateCalendarEventMutation();
  const updateEvent = useUpdateCalendarEventMutation();
  const deleteEvent = useDeleteCalendarEventMutation();

  const routineDays: RoutineDayCard[] = useMemo(() => {
    if (!routineDaysQuery.data) return [];
    return routineDaysQuery.data.map((d) => ({ ...d, color: routineDayColors[d.id] ?? d.color }));
  }, [routineDaysQuery.data, routineDayColors]);

  const events = eventsQuery.data ?? [];

  const dayEvents = useMemo(() => filterDayEvents(events, modal), [events, modal]);

  const handlePrevMonth = () => moveToPrevMonth(month, setMonth, setYear);

  const handleNextMonth = () => moveToNextMonth(month, setMonth, setYear);

  function handleDayClick(dateStr: string) {
    setModal({ type: 'day', dateStr });
  }

  function handleDrop(data: CalendarDragData, dateStr: string) {
    createEvent.mutate({
      type: 'workout',
      date: dateStr,
      title: data.planDayTitle,
      color: data.color,
      clientId: data.clientId,
      planDayId: data.planDayId,
    });
  }

  function handleDeleteEvent(eventId: string) {
    deleteEvent.mutate(eventId);
  }

  function handleMoveEvent(eventId: string, newDateStr: string) {
    updateEvent.mutate({ eventId, input: { date: newDateStr } });
  }

  const handleSaveNote = createNoteSaveHandler(createEvent, modal, selectedClient?.id, setModal);
  const handleSaveReminder = createReminderSaveHandler(createEvent, modal, selectedClient?.id, setModal);
  const handleUpdateNote = createNoteUpdateHandler(updateEvent, modal, setModal);
  const handleUpdateReminder = createReminderUpdateHandler(updateEvent, modal, setModal);

  function handleEditEvent(event: CalendarEventData) {
    const d = event.date instanceof Date ? event.date : new Date(event.date);
    const dateStr = d.toISOString().slice(0, 10);
    if (event.type === 'note') setModal({ type: 'editNote', event, dateStr });
    else if (event.type === 'reminder') setModal({ type: 'editReminder', event, dateStr });
  }

  return {
    year,
    month,
    selectedClient,
    setSelectedClient,
    modal,
    setModal,
    routineDays,
    events,
    dayEvents,
    clients,
    objectives: objectivesQuery.data ?? [],
    createEvent,
    updateEvent,
    handlePrevMonth,
    handleNextMonth,
    handleDayClick,
    handleDrop,
    handleDeleteEvent,
    handleMoveEvent,
    handleSaveNote,
    handleSaveReminder,
    handleUpdateNote,
    handleUpdateReminder,
    handleEditEvent,
    onRoutineDayColorChange: (dayId: string, color: string) => setRoutineDayColors((prev) => ({ ...prev, [dayId]: color })),
  };
}

type TopBarProps = { selectedClient: ClientView | null; t: TFunc };

function CalendarTopBar({ selectedClient, t }: TopBarProps): React.JSX.Element {
  const title = selectedClient
    ? t('coach.calendar.header.client', { name: `${selectedClient.firstName} ${selectedClient.lastName}` })
    : t('coach.calendar.header.coach');
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
        flexShrink: 0,
      }}
    >
      <View style={{ marginRight: 10, backgroundColor: '#eff6ff', padding: 8, borderRadius: 12 }}>
        <CalendarDays color={COLOR_PRIMARY} size={20} />
      </View>
      <View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>{title}</Text>
        <Text style={{ fontSize: 13, color: '#64748b' }}>{t('coach.calendar.subtitle')}</Text>
      </View>
    </View>
  );
}

type CalendarModalsProps = {
  modal: ModalState;
  setModal: React.Dispatch<React.SetStateAction<ModalState>>;
  dayEvents: CalendarEventData[];
  clientName: string | undefined;
  createIsPending: boolean;
  updateIsPending: boolean;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: CalendarEventData) => void;
  onSaveNote: (data: { title: string; content: string; color: string }) => void;
  onSaveReminder: (data: { content: string; time: string; color: string }) => void;
  onUpdateNote: (data: { title: string; content: string; color: string }) => void;
  onUpdateReminder: (data: { content: string; time: string; color: string }) => void;
  t: TFunc;
};

function CalendarModalsRenderer({
  modal,
  setModal,
  dayEvents,
  clientName,
  createIsPending,
  updateIsPending,
  onDeleteEvent,
  onEditEvent,
  onSaveNote,
  onSaveReminder,
  onUpdateNote,
  onUpdateReminder,
  t,
}: CalendarModalsProps): React.JSX.Element {
  const defaultColor = DEFAULT_COLOR?.bg ?? '#dbeafe';
  return (
    <>
      {modal.type === 'day' && (
        <DayDetailModal
          dateStr={modal.dateStr}
          dayEvents={dayEvents}
          onClose={() => setModal({ type: 'none' })}
          onAddNote={() => setModal({ type: 'addNote', dateStr: modal.dateStr })}
          onAddReminder={() => setModal({ type: 'addReminder', dateStr: modal.dateStr })}
          onDeleteEvent={onDeleteEvent}
          onEditEvent={onEditEvent}
          t={t}
        />
      )}
      {modal.type === 'addNote' && (
        <AddNoteModal
          clientName={clientName}
          onClose={() => setModal({ type: 'day', dateStr: modal.dateStr })}
          onSave={onSaveNote}
          isSaving={createIsPending}
          t={t}
        />
      )}
      {modal.type === 'addReminder' && (
        <AddReminderModal
          clientName={clientName}
          onClose={() => setModal({ type: 'day', dateStr: modal.dateStr })}
          onSave={onSaveReminder}
          isSaving={createIsPending}
          t={t}
        />
      )}
      {modal.type === 'editNote' && (
        <AddNoteModal
          clientName={clientName}
          initialValues={{
            title: modal.event.title ?? '',
            content: modal.event.content ?? '',
            color: modal.event.color ?? defaultColor,
          }}
          modalTitle={t('coach.calendar.note.editTitle')}
          saveLabel={t('coach.calendar.saveChanges')}
          onClose={() => setModal({ type: 'day', dateStr: modal.dateStr })}
          onSave={onUpdateNote}
          isSaving={updateIsPending}
          t={t}
        />
      )}
      {modal.type === 'editReminder' && (
        <AddReminderModal
          clientName={clientName}
          initialValues={{
            content: modal.event.content ?? '',
            time: modal.event.time ?? '09:00',
            color: modal.event.color ?? defaultColor,
          }}
          modalTitle={t('coach.calendar.reminder.editTitle')}
          saveLabel={t('coach.calendar.saveChanges')}
          onClose={() => setModal({ type: 'day', dateStr: modal.dateStr })}
          onSave={onUpdateReminder}
          isSaving={updateIsPending}
          t={t}
        />
      )}
    </>
  );
}

export function CalendarScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    year,
    month,
    selectedClient,
    setSelectedClient,
    modal,
    setModal,
    routineDays,
    events,
    dayEvents,
    clients,
    objectives,
    createEvent,
    updateEvent,
    handlePrevMonth,
    handleNextMonth,
    handleDayClick,
    handleDrop,
    handleDeleteEvent,
    handleMoveEvent,
    handleSaveNote,
    handleSaveReminder,
    handleUpdateNote,
    handleUpdateReminder,
    handleEditEvent,
    onRoutineDayColorChange,
  } = useCalendarLogic();

  const clientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : undefined;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#f8fafc', minHeight: 0, overflow: 'hidden' }}>
      <CalendarSidebar
        clients={clients}
        objectives={objectives}
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
        routineDays={routineDays}
        onRoutineDayColorChange={onRoutineDayColorChange}
        t={t}
      />
      <View style={{ flex: 1, flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <CalendarTopBar selectedClient={selectedClient} t={t} />
        <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <CalendarGrid
            year={year}
            month={month}
            events={events}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onDayClick={handleDayClick}
            onDrop={handleDrop}
            onMoveEvent={handleMoveEvent}
            t={t}
          />
        </View>
      </View>
      <CalendarModalsRenderer
        modal={modal}
        setModal={setModal}
        dayEvents={dayEvents}
        clientName={clientName}
        createIsPending={createEvent.isPending}
        updateIsPending={updateEvent.isPending}
        onDeleteEvent={handleDeleteEvent}
        onEditEvent={handleEditEvent}
        onSaveNote={handleSaveNote}
        onSaveReminder={handleSaveReminder}
        onUpdateNote={handleUpdateNote}
        onUpdateReminder={handleUpdateReminder}
        t={t}
      />
    </View>
  );
}
