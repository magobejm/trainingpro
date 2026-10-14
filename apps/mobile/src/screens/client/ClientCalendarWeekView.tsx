import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientCalendarSummary } from '../../data/hooks/useClientCalendar';
import { LIGHT } from '../../theme/light';
import { CALL_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';
import { ClientNoteEditor } from './ClientCalendarDayDetail';
import { CalendarCallPanel } from './ClientCalendarCallPanel';
import { KpiStrip } from './ClientCalendarKpiStrip';
import { weekDayLabel, type DayData, type PlanDayView } from './client-calendar.helpers';
import { CalendarWorkoutList } from './ClientCalendarWorkouts';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type Props = {
  data: DayData | undefined;
  dayData: Map<string, DayData>;
  exerciseCountFor: (planDayId: string | null) => number | null;
  onOpenPlanDay: (planDayId: string, view: PlanDayView) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenTest: (scheduleId: string) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  summary: ClientCalendarSummary | undefined;
  todayStr: string;
  week: Date[];
};

export function CalendarWeekView(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const dateKey = formatKey(props.selectedDate);
  const [notesOpen, toggleNotes] = useRememberedOpen(dateKey, Boolean(props.data?.clientNote));
  const [callOpen, toggleCall] = useRememberedOpen(dateKey, Boolean(props.data?.call));
  const monthName = t(`client.calendar.month.${String(props.selectedDate.getMonth() + 1)}`);
  const dateLabel = `${monthName} ${String(props.selectedDate.getDate())}`;
  const coachNotes = props.data?.coachNotes ?? [];

  return (
    <View style={styles.stack}>
      <View style={styles.dayCard}>
        <View style={styles.dayBody}>
          <Text style={styles.kicker}>{dateLabel}</Text>
          <CalendarWorkoutList
            data={props.data}
            exerciseCountFor={props.exerciseCountFor}
            onOpenPlanDay={props.onOpenPlanDay}
            onOpenSession={props.onOpenSession}
          />
        </View>
        {props.data?.physicalTest ? (
          <Pressable onPress={() => props.onOpenTest(props.data!.physicalTest!.scheduleId)} style={styles.testChip}>
            <Text style={styles.testChipText}>{props.data.physicalTest.name}</Text>
          </Pressable>
        ) : null}
      </View>

      {props.data?.scheduledCall ? (
        <InfoCard
          color={CALL_COLOR}
          lines={[t('client.calendar.detail.callWith', { time: props.data.scheduledCall.time })]}
          title={t('client.calendar.detail.callScheduled')}
        />
      ) : null}
      {coachNotes.length > 0 ? (
        <InfoCard color={COACH_NOTE_COLOR} lines={coachNotes} title={t('client.calendar.detail.coachNotes')} />
      ) : null}

      <View style={styles.weekRow}>
        {props.week.map((date, index) => (
          <WeekDay
            date={date}
            isSelected={sameDay(date, props.selectedDate)}
            isToday={formatKey(date) === props.todayStr}
            key={formatKey(date)}
            label={weekDayLabel(
              props.dayData.get(formatKey(date)),
              t('client.calendar.chip.rest'),
              t('client.calendar.week.note'),
            )}
            letter={t(`client.calendar.weekday.${WEEKDAY_KEYS[index]}`)}
            onPress={() => props.onSelectDate(date)}
          />
        ))}
      </View>

      {props.summary ? <KpiStrip data={props.summary} /> : null}

      <Text style={styles.panelHint}>{t('client.calendar.detail.panelsHint')}</Text>
      <Pressable onPress={toggleNotes} style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{t('client.calendar.detail.myNotes')}</Text>
      </Pressable>
      {notesOpen ? <ClientNoteEditor dateStr={dateKey} initial={props.data?.clientNote ?? ''} /> : null}
      <Pressable onPress={toggleCall} style={styles.panelHeader}>
        <Text style={styles.panelTitle}>
          {t(
            props.data?.call?.status === 'pending'
              ? 'client.calendar.detail.pendingCall'
              : 'client.calendar.detail.scheduleCall',
          )}
        </Text>
      </Pressable>
      {callOpen ? <CalendarCallPanel call={props.data?.call ?? null} dateStr={dateKey} /> : null}
    </View>
  );
}

function InfoCard(props: { color: string; lines: string[]; title: string }): React.JSX.Element {
  return (
    <View style={[styles.infoCard, { backgroundColor: props.color }]}>
      <Text style={styles.infoTitle}>{props.title}</Text>
      {props.lines.map((line, index) => (
        <Text key={`${line}-${String(index)}`} style={styles.infoBody}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function WeekDay(props: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  label: string;
  letter: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.weekDay}>
      <Pressable onPress={props.onPress} style={[styles.weekButton, props.isSelected && styles.weekButtonSelected]}>
        <Text style={[styles.weekNumber, props.isSelected && styles.weekSelectedText]}>{String(props.date.getDate())}</Text>
        <Text style={[styles.weekLetter, props.isSelected && styles.weekSelectedText]}>{props.letter}</Text>
      </Pressable>
      <Text numberOfLines={2} style={styles.weekLabel}>
        {props.label}
      </Text>
      {props.isToday && !props.isSelected ? <View style={styles.todayDot} /> : null}
    </View>
  );
}

function useRememberedOpen(key: string, fallback: boolean): [boolean, () => void] {
  const [choice, setChoice] = useState<{ key: string; open: boolean } | null>(null);
  const open = choice?.key === key ? choice.open : fallback;
  const toggle = () => setChoice({ key, open: !open });
  return [open, toggle];
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const styles = StyleSheet.create({
  dayBody: { gap: 6 },
  dayCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  hint: { color: LIGHT.accentDark, fontSize: 13 },
  infoBody: { color: '#f8fafc', fontSize: 15, fontWeight: '600', lineHeight: 22 },
  infoCard: { borderRadius: 16, gap: 6, paddingHorizontal: 16, paddingVertical: 14 },
  infoTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  kicker: { color: LIGHT.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  panelHeader: { backgroundColor: LIGHT.bgCard, borderColor: LIGHT.border, borderRadius: 14, borderWidth: 1, padding: 12 },
  panelHint: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  panelTitle: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '800' },
  stack: { gap: 12, paddingBottom: 24 },
  testChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#312e81',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  testChipText: { color: '#e0e7ff', fontSize: 12, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 28, fontWeight: '800' },
  todayDot: { backgroundColor: LIGHT.accent, borderRadius: 3, height: 6, width: 6 },
  weekButton: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  weekButtonSelected: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  weekDay: { alignItems: 'center', gap: 4, width: 44 },
  weekLabel: { color: LIGHT.textMuted, fontSize: 9, fontWeight: '700', textAlign: 'center', width: 44 },
  weekLetter: { color: LIGHT.textMuted, fontSize: 10 },
  weekNumber: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '700' },
  weekRow: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  weekSelectedText: { color: LIGHT.textOnNavy },
});
