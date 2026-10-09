import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientCalendarSummary } from '../../data/hooks/useClientCalendar';
import { LIGHT } from '../../theme/light';
import { CallRequest, ClientNoteEditor } from './ClientCalendarDayDetail';
import { KpiStrip } from './ClientCalendarKpiStrip';
import type { DayData } from './client-calendar.helpers';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type Props = {
  data: DayData | undefined;
  exerciseCount: number | null;
  onOpenPlanDay: (planDayId: string) => void;
  onOpenTest: (scheduleId: string) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  summary: ClientCalendarSummary | undefined;
  todayStr: string;
  week: Date[];
};

export function CalendarWeekView(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [notesOpen, setNotesOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const title = props.data?.planDayTitle ?? (props.data?.hasPlanned || props.data?.hasCompleted ? '—' : null);
  const monthName = t(`client.calendar.month.${String(props.selectedDate.getMonth() + 1)}`);
  const dateLabel = `${monthName} ${String(props.selectedDate.getDate())}`;
  const note = props.data?.coachNotes?.[0] ?? '';

  return (
    <View style={styles.stack}>
      <View style={styles.dayCard}>
        <Pressable
          disabled={!props.data?.planDayId}
          onPress={() => {
            if (props.data?.planDayId) props.onOpenPlanDay(props.data.planDayId);
          }}
          style={styles.dayBody}
        >
          <Text style={styles.kicker}>{dateLabel}</Text>
          <Text style={styles.title}>{title ?? t('client.calendar.detail.rest')}</Text>
          <Text style={styles.hint}>{dayHint(Boolean(title), Boolean(props.data?.planDayId), t)}</Text>
          {title && props.exerciseCount != null ? (
            <Text style={styles.meta}>
              {t('client.calendar.detail.exerciseCount', { count: props.exerciseCount, title })}
            </Text>
          ) : null}
        </Pressable>
        {props.data?.physicalTest ? (
          <Pressable onPress={() => props.onOpenTest(props.data!.physicalTest!.scheduleId)} style={styles.testChip}>
            <Text style={styles.testChipText}>{props.data.physicalTest.name}</Text>
          </Pressable>
        ) : null}
        {props.data?.call ? (
          <Text style={styles.meta}>{t('client.calendar.detail.callWith', { time: props.data.call.time })}</Text>
        ) : null}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>{t('client.calendar.detail.todayNotes')}</Text>
        <Text style={styles.noteBody}>{note || t('client.calendar.detail.noCoachNotes')}</Text>
      </View>

      <View style={styles.weekRow}>
        {props.week.map((date, index) => (
          <WeekDay
            date={date}
            isSelected={sameDay(date, props.selectedDate)}
            isToday={formatKey(date) === props.todayStr}
            key={formatKey(date)}
            letter={t(`client.calendar.weekday.${WEEKDAY_KEYS[index]}`)}
            onPress={() => props.onSelectDate(date)}
          />
        ))}
      </View>

      {props.summary ? <KpiStrip data={props.summary} /> : null}

      <Text style={styles.panelHint}>{t('client.calendar.detail.panelsHint')}</Text>
      <Pressable onPress={() => setNotesOpen((open) => !open)} style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{t('client.calendar.detail.myNotes')}</Text>
      </Pressable>
      {notesOpen ? (
        <ClientNoteEditor dateStr={formatKey(props.selectedDate)} initial={props.data?.clientNote ?? ''} />
      ) : null}
      <Pressable onPress={() => setCallOpen((open) => !open)} style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{t('client.calendar.detail.scheduleCall')}</Text>
      </Pressable>
      {callOpen ? <CallRequest dateStr={formatKey(props.selectedDate)} /> : null}
    </View>
  );
}

function WeekDay(props: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  letter: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.weekDay}>
      <Pressable onPress={props.onPress} style={[styles.weekButton, props.isSelected && styles.weekButtonSelected]}>
        <Text style={[styles.weekNumber, props.isSelected && styles.weekSelectedText]}>{String(props.date.getDate())}</Text>
        <Text style={[styles.weekLetter, props.isSelected && styles.weekSelectedText]}>{props.letter}</Text>
      </Pressable>
      {props.isToday && !props.isSelected ? <View style={styles.todayDot} /> : null}
    </View>
  );
}

function dayHint(hasWorkout: boolean, canOpen: boolean, t: (key: string) => string): string {
  if (canOpen) return t('client.calendar.detail.openWorkout');
  if (hasWorkout) return t('client.calendar.detail.sessionSummary');
  return t('client.calendar.detail.restHint');
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
  kicker: { color: LIGHT.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  meta: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '600' },
  noteBody: { color: LIGHT.textStrong, fontSize: 13, lineHeight: 18 },
  noteCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#1e3a8a33',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  noteTitle: { color: '#172554', fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
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
  weekDay: { alignItems: 'center', gap: 4 },
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
