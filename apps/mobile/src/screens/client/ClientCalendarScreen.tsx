import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useClientCalendarEventsQuery,
  useClientCalendarSessionsQuery,
  useClientCalendarSummaryQuery,
} from '../../data/hooks/useClientCalendar';
import { useClientRoutineQuery, type ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { DayDetailModal } from './ClientCalendarDayDetail';
import { MonthGrid, MonthHeader } from './ClientCalendarGrid';
import { CalendarWeekView } from './ClientCalendarWeekView';
import { buildMonthGrid, mergeDayData, toDateStr, type DayData } from './client-calendar.helpers';
import { getWeekDateRange } from './routine-schedule.utils';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type Props = {
  onClose: () => void;
  onOpenPlanDay?: (day: ClientRoutineDay) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenTest?: (scheduleId: string) => void;
};

export function ClientCalendarScreen({ onClose, onOpenPlanDay, onOpenSession, onOpenTest }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [showMonth, setShowMonth] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const routineQuery = useClientRoutineQuery();

  const weekRange = useMemo(() => getWeekDateRange(selectedDate), [selectedDate]);
  const monthStart = useMemo(() => toDateStr(currentMonth), [currentMonth]);
  const monthEnd = useMemo(
    () => toDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)),
    [currentMonth],
  );
  const selectedMonthStart = toDateStr(startOfMonth(selectedDate));
  const selectedMonthEnd = toDateStr(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

  const weekEvents = useClientCalendarEventsQuery(weekRange.from, weekRange.to);
  const monthEvents = useClientCalendarEventsQuery(monthStart, monthEnd);
  const weekSessions = useClientCalendarSessionsQuery(weekRange.from, weekRange.to);
  const monthSessions = useClientCalendarSessionsQuery(monthStart, monthEnd);
  const summaryQuery = useClientCalendarSummaryQuery(selectedMonthStart, selectedMonthEnd);

  const dayData = useMemo(() => {
    const events = [...(weekEvents.data?.data ?? []), ...(monthEvents.data?.data ?? [])];
    const sessions = [...(weekSessions.data ?? []), ...(monthSessions.data ?? [])];
    return mergeDayData(events, sessions);
  }, [monthEvents.data, monthSessions.data, weekEvents.data, weekSessions.data]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const monthName = t(`client.calendar.month.${String(currentMonth.getMonth() + 1)}`);
  const monthLabel = `${monthName} ${String(currentMonth.getFullYear())}`;
  const selectedKey = toDateStr(selectedDate);
  const selectedDay = dayData.get(selectedKey);
  const planDays = routineQuery.data?.planDays ?? [];
  const exerciseCount = exerciseCountFor(planDays, selectedDay?.planDayId ?? null);
  const popupPlanDayId = popupDate ? (dayData.get(popupDate)?.planDayId ?? null) : null;
  const popupCount = exerciseCountFor(planDays, popupPlanDayId);

  const openMonth = useCallback(() => {
    setCurrentMonth(startOfMonth(selectedDate));
    setShowMonth(true);
  }, [selectedDate]);
  const openPlanDay = useCallback(
    (planDayId: string | null | undefined) => {
      const day = findPlanDay(planDays, planDayId);
      if (day) onOpenPlanDay?.(day);
    },
    [onOpenPlanDay, planDays],
  );

  return (
    <View style={styles.container}>
      {showMonth ? (
        <MonthHeader
          label={monthLabel}
          onBack={() => setShowMonth(false)}
          onNext={() => setCurrentMonth((month) => shiftMonth(month, 1))}
          onPrev={() => setCurrentMonth((month) => shiftMonth(month, -1))}
        />
      ) : (
        <View style={styles.headerBar}>
          <Pressable accessibilityLabel={t('client.calendar.detail.close')} onPress={onClose} style={styles.backButton}>
            <Text style={styles.backIcon}>{'←'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('client.calendar.title')}</Text>
          <Pressable accessibilityLabel={t('client.calendar.openMonth')} onPress={openMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>{t('client.calendar.openMonth')}</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showMonth ? (
          <MonthGrid cells={buildMonthGrid(currentMonth)} dayData={dayData} onSelectDay={setPopupDate} todayStr={todayStr} />
        ) : (
          <CalendarWeekView
            data={selectedDay}
            exerciseCount={exerciseCount}
            onOpenPlanDay={openPlanDay}
            onOpenTest={(scheduleId) => onOpenTest?.(scheduleId)}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
            summary={summaryQuery.data}
            todayStr={todayStr}
            week={weekDates(selectedDate)}
          />
        )}
      </ScrollView>
      <DayPopup
        count={popupCount}
        data={popupDate ? dayData.get(popupDate) : undefined}
        dateStr={popupDate}
        onClose={() => setPopupDate(null)}
        onOpenPlanDay={openPlanDay}
        onOpenSession={onOpenSession}
        onOpenTest={onOpenTest}
      />
    </View>
  );
}

function DayPopup(props: {
  count: number | null;
  data: DayData | undefined;
  dateStr: string | null;
  onClose: () => void;
  onOpenPlanDay: (planDayId: string | null | undefined) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenTest?: (scheduleId: string) => void;
}): React.JSX.Element | null {
  if (!props.dateStr) return null;
  return (
    <DayDetailModal
      data={props.data}
      dateStr={props.dateStr}
      exerciseCount={props.count}
      onClose={props.onClose}
      onOpenPlanDay={(planDayId) => {
        props.onClose();
        props.onOpenPlanDay(planDayId);
      }}
      onOpenSession={props.onOpenSession}
      onOpenTest={(scheduleId) => {
        props.onClose();
        props.onOpenTest?.(scheduleId);
      }}
    />
  );
}

function findPlanDay(days: ClientRoutineDay[], planDayId: string | null | undefined): ClientRoutineDay | null {
  if (!planDayId) return null;
  return days.find((day) => day.id === planDayId) ?? null;
}

function exerciseCountFor(days: Array<{ exercises: unknown[]; id: string }>, planDayId: string | null): number | null {
  if (!planDayId) return null;
  const day = days.find((item) => item.id === planDayId);
  return day ? day.exercises.length : null;
}

function weekDates(date: Date): Date[] {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day + offset);
  return Array.from(
    { length: 7 },
    (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

const styles = StyleSheet.create({
  backButton: { padding: 8 },
  backIcon: { color: LIGHT.textStrong, fontSize: 22, fontWeight: '700' },
  container: SCREEN.root,
  content: { paddingBottom: 32, paddingHorizontal: 12 },
  headerBar: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 18, fontWeight: '800' },
  monthButton: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthButtonText: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '700' },
});
