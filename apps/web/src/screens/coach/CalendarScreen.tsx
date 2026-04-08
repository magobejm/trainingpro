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
import type { CalendarEventData, RoutineDayCard } from './calendar-screen.types';
import { DEFAULT_COLOR } from './calendar-screen.types';
import { gridRangeDates } from './calendar-screen.utils';
import { CalendarSidebar } from './CalendarScreen.sidebar';
import { CalendarGrid } from './CalendarScreen.grid';
import { DayDetailModal, AddNoteModal, AddReminderModal } from './CalendarScreen.modals';
import type { CalendarClipboard } from './CalendarScreen.week-row';
import type { ModalState } from './CalendarScreen.handlers';
import {
  filterDayEvents,
  moveToPrevMonth,
  moveToNextMonth,
  createDropHandler,
  createNoteSaveHandler,
  createReminderSaveHandler,
  createNoteUpdateHandler,
  createReminderUpdateHandler,
  createEditEventHandler,
  createWeekMoveHandler,
  createCopyPasteHandlers,
} from './CalendarScreen.handlers';

const COLOR_PRIMARY = '#3b82f6' as const;

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

function useCalendarLogic() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [routineDayColors, setRoutineDayColors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [clipboard, setClipboard] = useState<CalendarClipboard | null>(null);

  const { dateFrom, dateTo } = gridRangeDates(year, month);
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
  const planTemplateId = selectedClient?.trainingPlanId ?? selectedClient?.trainingPlan?.id ?? null;
  const eventsQuery = useCalendarEventsQuery(dateFrom, dateTo, selectedClient?.id);
  const routineDaysQuery = useClientRoutineDaysQuery(planTemplateId);
  const createEvent = useCreateCalendarEventMutation();
  const updateEvent = useUpdateCalendarEventMutation();
  const deleteEvent = useDeleteCalendarEventMutation();
  const routineDays: RoutineDayCard[] = useMemo(
    () => (routineDaysQuery.data ?? []).map((d) => ({ ...d, color: routineDayColors[d.id] ?? d.color })),
    [routineDaysQuery.data, routineDayColors],
  );
  const events = eventsQuery.data ?? [];
  const dayEvents = useMemo(() => filterDayEvents(events, modal), [events, modal]);

  const handlePrevMonth = () => moveToPrevMonth(month, setMonth, setYear);
  const handleNextMonth = () => moveToNextMonth(month, setMonth, setYear);
  const handleGoTo = useCallback((y: number, m: number) => {
    setYear(y);
    setMonth(m);
  }, []);
  const handleDayClick = (dateStr: string) => setModal({ type: 'day', dateStr });
  const handleDeleteEvent = (eventId: string) => deleteEvent.mutate(eventId);
  const handleMoveEvent = (eventId: string, d: string) => updateEvent.mutate({ eventId, input: { date: d } });
  const handleMoveWeek = createWeekMoveHandler(updateEvent, events);
  const { handleCopyWeek, handleCopyDay, handlePasteWeek, handlePasteDay } = createCopyPasteHandlers(
    createEvent,
    clipboard,
    setClipboard,
    events,
  );
  const handleClearClipboard = useCallback(() => setClipboard(null), []);
  const handleDrop = createDropHandler(createEvent, selectedClient?.id);
  const handleSaveNote = createNoteSaveHandler(createEvent, modal, selectedClient?.id, setModal);
  const handleSaveReminder = createReminderSaveHandler(createEvent, modal, selectedClient?.id, setModal);
  const handleUpdateNote = createNoteUpdateHandler(updateEvent, modal, setModal);
  const handleUpdateReminder = createReminderUpdateHandler(updateEvent, modal, setModal);
  const handleEditEvent = createEditEventHandler(setModal);

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
    handleGoTo,
    handleDayClick,
    handleDrop,
    handleDeleteEvent,
    handleMoveEvent,
    handleMoveWeek,
    clipboard,
    handleCopyWeek,
    handleCopyDay,
    handlePasteWeek,
    handlePasteDay,
    handleClearClipboard,
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
    handleGoTo,
    handleDayClick,
    handleDrop,
    handleDeleteEvent,
    handleMoveEvent,
    handleMoveWeek,
    clipboard,
    handleCopyWeek,
    handleCopyDay,
    handlePasteWeek,
    handlePasteDay,
    handleClearClipboard,
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
            clipboard={clipboard}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoTo={handleGoTo}
            onDayClick={handleDayClick}
            onDrop={handleDrop}
            onMoveEvent={handleMoveEvent}
            onMoveWeek={handleMoveWeek}
            onCopyWeek={handleCopyWeek}
            onPasteWeek={handlePasteWeek}
            onCopyDay={handleCopyDay}
            onPasteDay={handlePasteDay}
            onClearClipboard={handleClearClipboard}
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
