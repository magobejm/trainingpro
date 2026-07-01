import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useClientCalendarEventsQuery,
  useClientCalendarSessionsQuery,
  useClientCalendarSummaryQuery,
} from '../../data/hooks/useClientCalendar';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { DayDetailModal } from './ClientCalendarDayDetail';
import { KpiStrip } from './ClientCalendarKpiStrip';
import { MonthGrid, MonthHeader } from './ClientCalendarGrid';
import { buildMonthGrid, mergeDayData, toDateStr } from './client-calendar.helpers';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type CalendarMode = 'planned' | 'progress';

type Props = {
  initialMode?: CalendarMode;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
};

function ModeToggle({ mode, onChange }: { mode: CalendarMode; onChange: (m: CalendarMode) => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.modeRow}>
      <Pressable onPress={() => onChange('progress')} style={[styles.modeBtn, mode === 'progress' && styles.modeBtnActive]}>
        <Text style={[styles.modeBtnText, mode === 'progress' && styles.modeBtnTextActive]}>
          {t('client.calendar.mode.progress')}
        </Text>
      </Pressable>
      <Pressable onPress={() => onChange('planned')} style={[styles.modeBtn, mode === 'planned' && styles.modeBtnActive]}>
        <Text style={[styles.modeBtnText, mode === 'planned' && styles.modeBtnTextActive]}>
          {t('client.calendar.mode.planned')}
        </Text>
      </Pressable>
    </View>
  );
}

export function ClientCalendarScreen({ initialMode, onClose, onOpenSession }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CalendarMode>(initialMode ?? 'progress');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStart = useMemo(() => toDateStr(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => {
    return toDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  }, [currentMonth]);

  const eventsQuery = useClientCalendarEventsQuery(monthStart, monthEnd);
  const sessionsQuery = useClientCalendarSessionsQuery(monthStart, monthEnd);
  const summaryQuery = useClientCalendarSummaryQuery(monthStart, monthEnd);

  const { cells, dayData } = useMemo(() => {
    const events = eventsQuery.data?.data ?? [];
    const sessions = sessionsQuery.data ?? [];
    return { cells: buildMonthGrid(currentMonth), dayData: mergeDayData(events, sessions) };
  }, [eventsQuery.data, sessionsQuery.data, currentMonth]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const monthKey = `client.calendar.month.${String(currentMonth.getMonth() + 1)}`;
  const monthLabel = `${t(monthKey)} ${String(currentMonth.getFullYear())}`;

  const prevMonth = useCallback(() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)), []);
  const nextMonth = useCallback(() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)), []);

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.calendar.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === 'progress' && summaryQuery.data ? <KpiStrip data={summaryQuery.data} /> : null}
        <MonthHeader label={monthLabel} onNext={nextMonth} onPrev={prevMonth} />
        <MonthGrid cells={cells} dayData={dayData} onSelectDay={setSelectedDay} todayStr={todayStr} />
      </ScrollView>
      {selectedDay ? (
        <DayDetailModal
          data={dayData.get(selectedDay)}
          dateStr={selectedDay}
          onClose={() => setSelectedDay(null)}
          onOpenSession={onOpenSession}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: SCREEN.root,
  content: { paddingBottom: 32, paddingHorizontal: 12 },
  modeBtnActive: { backgroundColor: LIGHT.accent },
  modeBtnTextActive: { color: LIGHT.textOnNavy, fontWeight: '700' },
  modeBtn: { borderRadius: LIGHT.radiusSm, flex: 1, paddingVertical: 8 },
  modeBtnText: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  modeRow: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    marginTop: 8,
    padding: 4,
  },
});
