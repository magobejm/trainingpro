import { useCoachEditor } from './useCoachEditor';
import React, { useState } from 'react';
import type { SessionOutcome } from '@trainerpro/shared';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { LIGHT } from '../../theme/light';
import { useTranslation } from 'react-i18next';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import {
  CoachButton,
  CoachConflict,
  CoachField,
  CoachPage,
  CoachSelect,
  CoachStatus,
  confirmCoachDelete,
  ui,
} from './CoachUi';
import { CoachClientPicker } from './CoachClientPicker';
import { coachMonthDays, localCoachDate, shiftCoachDate, shiftCoachMonth, isCoachDate } from './coach-calendar';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { createApiClient } from '../../data/api-client';
import { useCoachSaveGuard } from './useCoachSaveGuard';
import { stableDraftValue } from '../../data/coach-draft-policy';
import { CoachSessionView } from './CoachProgressScreen';

export type CoachCalendarEvent = {
  id: string;
  clientId: string | null;
  clientName?: string;
  type: string;
  date: string;
  title: string | null;
  content: string | null;
  time: string | null;
  callStatus?: string;
  planDayId?: string;
  planDayTitle?: string;
  scheduleId?: string;
  sessionId?: string;
  outcome?: SessionOutcome;
  originDate?: string | null;
  skipReason?: string | null;
  updatedAt?: string;
};
type EventDraft = {
  type: string;
  date: string;
  title: string;
  content: string;
  time: string;
  clientId: string;
  planDayId: string;
};
type PlanDay = { id: string; title: string; dayIndex: number };
export function CoachCalendarScreen({
  clientId,
  onOpen,
}: {
  clientId?: string;
  onOpen: (feature: string, clientId?: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [date, setDate] = useState(localCoachDate());
  const [mode, setMode] = useState('week');
  const [filter, setFilter] = useState(clientId ?? '');
  const [coachOnly, setCoachOnly] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { value: editing, select: setEditing, close: closeEditor } = useCoachEditor<CoachCalendarEvent | 'new'>();
  const from = date.slice(0, 7) + '-01';
  const nextMonth = new Date(from + 'T12:00:00');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(0);
  const params = new URLSearchParams({
    dateFrom: from,
    dateTo: localCoachDate(nextMonth),
    ...(filter ? { clientId: filter } : {}),
    ...(coachOnly ? { coachOnly: 'true' } : {}),
  });
  const query = useCoachQuery<{ data: CoachCalendarEvent[] }>('/calendar?' + params);
  const events = (query.data?.data ?? [])
    .filter((event) => event.date.slice(0, 10) === date)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const days = mode === 'month' ? coachMonthDays(date) : Array.from({ length: 7 }, (_, i) => shiftCoachDate(date, i - 3));
  if (sessionId) return <CoachSessionView sessionId={sessionId} onBack={() => setSessionId(null)} />;
  if (editing)
    return (
      <CalendarEditor
        key={editing === 'new' ? 'new' : editing.id}
        event={editing === 'new' ? undefined : editing}
        initialDate={date}
        clientId={filter}
        onClose={closeEditor}
      />
    );
  return (
    <CoachPage title={t('coachWorkspace.calendar')}>
      <CoachClientPicker value={filter} onChange={setFilter} optional />
      <CoachSelect
        label={t('coachWorkspace.scope')}
        value={coachOnly ? 'own' : 'all'}
        onChange={(value) => setCoachOnly(value === 'own')}
        options={[
          { value: 'all', label: t('coachWorkspace.all') },
          { value: 'own', label: t('coachWorkspace.ownAgenda') },
        ]}
      />
      <CoachSelect
        label={t('coachWorkspace.view')}
        value={mode}
        onChange={setMode}
        options={['week', 'month'].map((value) => ({ value, label: t('coachWorkspace.' + value) }))}
      />
      <View style={ui.row}>
        <CoachButton
          label={'‹'}
          onPress={() => setDate(mode === 'month' ? shiftCoachMonth(date, -1) : shiftCoachDate(date, -7))}
        />
        <Text style={ui.text}>
          {new Date(date + 'T12:00:00').toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
        </Text>
        <CoachButton
          label={'›'}
          onPress={() => setDate(mode === 'month' ? shiftCoachMonth(date, 1) : shiftCoachDate(date, 7))}
        />
      </View>
      <CalendarDateGrid days={days} date={date} setDate={setDate} language={i18n.language} />
      <CoachButton label={t('coachWorkspace.newEvent')} onPress={() => setEditing('new')} />
      <CoachStatus query={query} empty={events.length === 0} />
      {events.map((event) => (
        <CalendarEventCard key={event.id} event={event} onOpen={onOpen} onEdit={setEditing} onOpenSession={setSessionId} />
      ))}
    </CoachPage>
  );
}

function CalendarEventCard({
  event,
  onOpen,
  onEdit,
  onOpenSession,
}: {
  event: CoachCalendarEvent;
  onOpen: (feature: string, clientId?: string) => void;
  onEdit: (event: CoachCalendarEvent) => void;
  onOpenSession: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={[ui.card, eventTone(event.type)]}>
      <Text style={ui.label}>
        {t('coachWorkspace.event.' + event.type)}
        {' · '}
        {event.time ?? '—'}
      </Text>
      <Text style={ui.text}>{event.title ?? event.planDayTitle ?? t('coachWorkspace.event.' + event.type)}</Text>
      <Text style={ui.muted}>
        {event.clientName ?? ''} {event.callStatus ? t('coachWorkspace.call.' + event.callStatus.toLowerCase()) : ''}{' '}
        {event.outcome ? t('training.outcome.' + event.outcome) : ''}
      </Text>
      <Text style={ui.muted}>{event.date.slice(0, 10)}</Text>
      {event.originDate ? (
        <Text style={ui.muted}>{t('training.originDate') + ': ' + event.originDate.slice(0, 10)}</Text>
      ) : null}
      {event.skipReason ? <Text style={ui.text}>{event.skipReason}</Text> : null}
      {event.content ? <Text style={ui.text}>{event.content}</Text> : null}
      {event.type === 'workout' && event.sessionId ? (
        <CoachButton
          label={t('coachWorkspace.open')}
          onPress={() => {
            if (event.sessionId) onOpenSession(event.sessionId);
          }}
        />
      ) : null}
      {event.type === 'physical_test' ? (
        <CoachButton label={t('coachWorkspace.open')} onPress={() => onOpen('tests', event.clientId ?? undefined)} />
      ) : (
        <CoachButton label={t('coachWorkspace.edit')} onPress={() => onEdit(event)} />
      )}
    </View>
  );
}

function CalendarEditor({
  event,
  initialDate,
  clientId,
  onClose,
}: {
  event?: CoachCalendarEvent;
  initialDate: string;
  clientId?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const write = useCoachWrite();
  const auth = useCoachAuth();
  const guard = useCoachSaveGuard();
  const draft = useCoachDraft<EventDraft>(
    'calendar:' + (event?.id ?? 'new:' + clientId),
    {
      type: event?.type ?? 'note',
      date: event?.date.slice(0, 10) ?? initialDate,
      title: event?.title ?? '',
      content: event?.content ?? '',
      time: event?.time ?? '09:00',
      clientId: event?.clientId ?? clientId ?? '',
      planDayId: event?.planDayId ?? '',
    },
    event ? stableDraftValue(event) : undefined,
  );
  const value = draft.value;
  const client = useCoachQuery<{ trainingPlanId?: string | null }>(value.clientId ? '/clients/' + value.clientId : null);
  const routine = useCoachQuery<{ days: PlanDay[] }>(
    client.data?.trainingPlanId ? '/plans/templates/routines/' + client.data.trainingPlanId : null,
  );
  const set = (key: keyof EventDraft, next: string) => draft.setValue((old) => ({ ...old, [key]: next }));
  const persist = async () => {
    if (draft.conflict || !draft.ready) return;
    if (!event && value.type === 'call')
      await write.mutateAsync({
        path: '/calls/proposals',
        body: { clientId: value.clientId, date: value.date, time: value.time },
      });
    else
      await write.mutateAsync({
        path: '/calendar' + (event ? '/' + event.id : ''),
        method: event ? 'PATCH' : 'POST',
        body: event
          ? { title: value.title, content: value.content, date: value.date, time: value.time }
          : { ...value, clientId: value.clientId || undefined, planDayId: value.planDayId || undefined },
      });
    await draft.clear();
    onClose();
  };
  const save = () =>
    event
      ? guard.run(
          event,
          async () => {
            const params = new URLSearchParams({ dateFrom: event.date.slice(0, 10), dateTo: event.date.slice(0, 10) });
            const latest = await createApiClient(auth).get<{ data: CoachCalendarEvent[] }>('/calendar?' + params);
            return latest.data.find((item) => item.id === event.id);
          },
          persist,
        )
      : persist();
  const valid =
    validCoachEvent(value) &&
    (event || value.type !== 'workout' || (routine.data?.days ?? []).some((day) => day.id === value.planDayId));
  return (
    <CoachPage title={t('coachWorkspace.newEvent')} onBack={onClose}>
      <CoachConflict conflict={draft.conflict || guard.conflict} onDiscard={() => void draft.clear().then(onClose)} />
      <CalendarTypeField event={event} value={value.type} onChange={(next) => set('type', next)} />
      {!event ? (
        <CoachClientPicker
          value={value.clientId}
          onChange={(next) => draft.setValue((old) => ({ ...old, clientId: next, planDayId: '' }))}
          optional
        />
      ) : null}
      <CalendarTextFields value={value} set={set} />
      {value.type === 'workout' && !event ? (
        <CalendarRoutineField query={routine} value={value.planDayId} onChange={(next) => set('planDayId', next)} />
      ) : null}
      <CoachButton
        label={t('coachWorkspace.save')}
        onPress={() => void save().catch(() => undefined)}
        disabled={!valid || !draft.ready || draft.conflict || guard.conflict}
        loading={write.isPending || guard.busy}
      />
      {event ? (
        <CoachButton
          label={t('coachWorkspace.delete')}
          onPress={() => removeCalendarEvent(event!, write, onClose, t)}
          disabled={write.isPending}
          danger
        />
      ) : null}
    </CoachPage>
  );
}

const calendarStyles = StyleSheet.create({
  call: { borderLeftWidth: 4, borderLeftColor: LIGHT.purple },
  workout: { borderLeftWidth: 4, borderLeftColor: LIGHT.accent },
  physical_test: { borderLeftWidth: 4, borderLeftColor: LIGHT.emerald },
  reminder: { borderLeftWidth: 4, borderLeftColor: LIGHT.orange },
  note: { borderLeftWidth: 4, borderLeftColor: LIGHT.indigo },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.285%', minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: LIGHT.radiusSm },
  selected: { backgroundColor: LIGHT.accent },
  selectedText: { color: LIGHT.textOnNavy, fontWeight: '700' },
});
function eventTone(type: string) {
  return calendarStyles[type as 'call' | 'workout' | 'physical_test' | 'reminder' | 'note'] ?? calendarStyles.note;
}

function CalendarTextFields({ value, set }: { value: EventDraft; set: (key: keyof EventDraft, next: string) => void }) {
  const { t } = useTranslation();
  return (
    <>
      {(['date', 'time', 'title', 'content'] as const).map((field) => (
        <CoachField
          key={field}
          label={t('coachWorkspace.' + field)}
          value={value[field]}
          onChange={(next) => set(field, next)}
          multiline={field === 'content'}
        />
      ))}
    </>
  );
}

function CalendarDateGrid({
  days,
  date,
  setDate,
  language,
}: {
  days: string[];
  date: string;
  setDate: (date: string) => void;
  language: string;
}) {
  return (
    <View style={calendarStyles.grid}>
      {days.map((value) => (
        <Pressable
          key={value}
          accessibilityRole={'button'}
          accessibilityLabel={value}
          accessibilityState={{ selected: value === date }}
          onPress={() => setDate(value)}
          style={[calendarStyles.day, value === date && calendarStyles.selected]}
        >
          <Text style={value === date ? calendarStyles.selectedText : ui.text}>
            {new Date(value + 'T12:00:00').toLocaleDateString(language, { weekday: 'short' })}
          </Text>
          <Text style={value === date ? calendarStyles.selectedText : ui.text}>{Number(value.slice(-2))}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function validCoachEvent(value: EventDraft) {
  return (
    isCoachDate(value.date) &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time) &&
    (value.type !== 'call' || !!value.clientId) &&
    (value.type !== 'workout' || !!value.planDayId)
  );
}

function removeCalendarEvent(
  event: CoachCalendarEvent,
  write: ReturnType<typeof useCoachWrite>,
  onClose: () => void,
  t: ReturnType<typeof useTranslation>['t'],
) {
  return confirmCoachDelete(
    event.title ?? t('coachWorkspace.event'),
    () => {
      const request = { path: '/calendar/' + event.id, method: 'DELETE' as const };
      void write
        .mutateAsync(request)
        .then(onClose)
        .catch(() => undefined);
    },
    t,
  );
}

function CalendarTypeField({
  event,
  value,
  onChange,
}: {
  event?: CoachCalendarEvent;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <CoachSelect
      label={t('coachWorkspace.type')}
      value={value}
      onChange={onChange}
      options={(event ? [event.type] : ['note', 'reminder', 'workout', 'call']).map((type) => ({
        value: type,
        label: t('coachWorkspace.event.' + type),
      }))}
    />
  );
}

function CalendarRoutineField({
  query,
  value,
  onChange,
}: {
  query: ReturnType<typeof useCoachQuery<{ days: PlanDay[] }>>;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <CoachStatus query={query} />
      <CoachSelect
        label={t('coachWorkspace.routineDay')}
        value={value}
        onChange={onChange}
        options={(query.data?.days ?? []).map((day) => ({ value: day.id, label: day.title }))}
      />
    </>
  );
}
