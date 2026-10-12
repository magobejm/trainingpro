import { useMutationFeedback } from '../../data/hooks/useFeedbackMutation';
import {
  getLayoutStyle1,
  getLayoutStyle2,
  getLayoutStyle3,
  getLayoutStyle4,
  getLayoutStyle5,
} from './CalendarScreen.layout-styles';

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
import { useCreateCallProposalMutation } from '../../data/hooks/useChat';
import { useArchivePhysicalTestScheduleMutation } from '../../data/hooks/usePhysicalTests';
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
import { useCalendarListContext } from './useCalendarListContext';
import { colors, space, useBreakpoint } from '@trainerpro/ui';
const COLOR_PRIMARY = colors.primary;
const CALENDAR_STACKED_MIN_HEIGHT = 720;
const rootStyle = (stacked: boolean) =>
  ({
    flex: 1,
    flexDirection: stacked ? 'column' : 'row',
    backgroundColor: colors.surfaceMuted,
    minHeight: 0,
    overflow: stacked ? 'scroll' : 'hidden',
  }) as const;
const mainStyle = (stacked: boolean) =>
  ({
    flex: stacked ? undefined : 1,
    flexDirection: 'column',
    minWidth: 0,
    minHeight: stacked ? CALENDAR_STACKED_MIN_HEIGHT : 0,
    overflow: 'hidden',
  }) as const;
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
function useCalendarLogic() {
  const [routineDayColors, setRoutineDayColors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [clipboard, setClipboard] = useState<CalendarClipboard | null>(null);
  const clientsQuery = useClientsQuery();
  const objectivesQuery = useClientObjectivesQuery();
  const clients = clientsQuery.data ?? [];
  const { month, selectedClientId, setAllView, setCoachOnlyView, setMonth, setSelectedClient, setYear, viewMode, year } =
    useCalendarListContext(clients);
  const { dateFrom, dateTo } = gridRangeDates(year, month);
  const selectedClient = useMemo(
    () => (selectedClientId ? (clients.find((c) => c.id === selectedClientId) ?? null) : null),
    [clients, selectedClientId],
  );
  const planTemplateId = selectedClient?.trainingPlanId ?? selectedClient?.trainingPlan?.id ?? null;
  const eventsQuery = useCalendarEventsQuery(dateFrom, dateTo, selectedClient?.id, viewMode === 'coachOnly');
  const routineDaysQuery = useClientRoutineDaysQuery(planTemplateId);
  const createEvent = useCreateCalendarEventMutation();
  const proposeCall = useCreateCallProposalMutation();
  const updateEvent = useUpdateCalendarEventMutation();
  const deleteEvent = useDeleteCalendarEventMutation();
  const archiveSchedule = useArchivePhysicalTestScheduleMutation();
  useMutationFeedback(archiveSchedule);
  const routineDays: RoutineDayCard[] = useMemo(
    () => (routineDaysQuery.data ?? []).map((d) => ({ ...d, color: routineDayColors[d.id] ?? d.color })),
    [routineDaysQuery.data, routineDayColors],
  );
  const events = eventsQuery.data ?? [];
  const dayEvents = useMemo(() => filterDayEvents(events, modal), [events, modal]);
  const handlePrevMonth = () => moveToPrevMonth(month, setMonth, setYear);
  const handleNextMonth = () => moveToNextMonth(month, setMonth, setYear);
  const handleGoTo = (year: number, month: number) => {
    setYear(year);
    setMonth(month);
  };
  const handleDayClick = (dateStr: string) => setModal({ type: 'day', dateStr });
  const handleDeleteEvent = (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (event?.type === 'physical_test' && event.clientId) {
      archiveSchedule.mutate({ clientId: event.clientId, scheduleId: event.scheduleId ?? event.id });
      return;
    }
    deleteEvent.mutate(eventId);
  };
  const handleMoveEvent = (eventId: string, d: string) => updateEvent.mutate({ eventId, input: { date: d } });
  const handleMoveWeek = createWeekMoveHandler(updateEvent, events);
  const { handleCopyWeek, handleCopyDay, handlePasteWeek, handlePasteDay } = createCopyPasteHandlers(
    createEvent,
    clipboard,
    setClipboard,
    events,
    proposeCall,
  );
  const handleClearClipboard = useCallback(() => setClipboard(null), []);
  const handleDrop = createDropHandler(createEvent, selectedClient?.id);
  const handleSaveNote = createNoteSaveHandler(createEvent, modal, selectedClient?.id, setModal);
  const handleSaveReminder = createReminderSaveHandler(proposeCall, modal, selectedClient?.id, setModal);
  const handleUpdateNote = createNoteUpdateHandler(updateEvent, modal, setModal);
  const handleUpdateReminder = createReminderUpdateHandler(updateEvent, modal, setModal);
  const handleEditEvent = createEditEventHandler(setModal);
  return {
    year,
    month,
    selectedClient,
    setSelectedClient,
    viewMode,
    setCoachOnlyView,
    setAllView,
    modal,
    setModal,
    routineDays,
    events,
    dayEvents,
    clients,
    objectives: objectivesQuery.data ?? [],
    createEvent,
    proposeCall,
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
type TopBarProps = {
  selectedClient: ClientView | null;
  t: TFunc;
};
function CalendarTopBar({ selectedClient, t }: TopBarProps): React.JSX.Element {
  const title = selectedClient
    ? t('coach.calendar.header.client', { name: `${selectedClient.firstName} ${selectedClient.lastName}` })
    : t('coach.calendar.header.coach');
  const layoutStyle1 = getLayoutStyle1(useBreakpoint() === 'sm' ? space.lg : space.xl);
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3;
  const layoutStyle4 = getLayoutStyle4;
  return (
    <View style={layoutStyle1}>
      <View style={layoutStyle2}>
        <CalendarDays color={COLOR_PRIMARY} size={20} />
      </View>
      <View>
        <Text style={layoutStyle3}>{title}</Text>
        <Text style={layoutStyle4}>{t('coach.calendar.subtitle')}</Text>
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
  onSaveReminder: (data: { date?: string; content: string; time: string; color: string }) => void;
  onUpdateNote: (data: { title: string; content: string; color: string }) => void;
  onUpdateReminder: (data: { date?: string; content: string; time: string; color: string }) => void;
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
  const defaultColor = DEFAULT_COLOR?.bg ?? colors.primaryBorder;
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
          initialDate={modal.dateStr}
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
          initialDate={modal.dateStr}
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
    viewMode,
    setCoachOnlyView,
    setAllView,
    modal,
    setModal,
    routineDays,
    events,
    dayEvents,
    clients,
    objectives,
    createEvent,
    proposeCall,
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
  const stacked = useBreakpoint() === 'sm';
  const layoutStyle5 = getLayoutStyle5;
  return (
    <View style={rootStyle(stacked)}>
      <CalendarSidebar
        clients={clients}
        objectives={objectives}
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
        viewMode={viewMode}
        onCoachOnlyView={setCoachOnlyView}
        onAllView={setAllView}
        routineDays={routineDays}
        onRoutineDayColorChange={onRoutineDayColorChange}
        t={t}
      />
      <View style={mainStyle(stacked)}>
        <CalendarTopBar selectedClient={selectedClient} t={t} />
        <View style={layoutStyle5}>
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
        createIsPending={createEvent.isPending || proposeCall.isPending}
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
