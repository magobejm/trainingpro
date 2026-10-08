import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { DayData, GridCell } from './client-calendar.helpers';
import { LIGHT } from '../../theme/light';
import { CALL_COLOR, CLIENT_NOTE_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';

const BG_COMPLETED = LIGHT.emerald;
const BG_PLANNED = LIGHT.accent;
const TEXT_DIM = LIGHT.textMuted;
const TEXT_MAIN = LIGHT.textStrong;

type MonthHeaderProps = {
  label: string;
  onNext: () => void;
  onPrev: () => void;
};

export function MonthHeader({ label, onNext, onPrev }: MonthHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.monthHeader}>
      <Pressable accessibilityLabel={t('client.calendar.nav.prev')} onPress={onPrev}>
        <Text style={styles.navBtn}>{'‹'}</Text>
      </Pressable>
      <Text style={styles.monthLabel}>{label}</Text>
      <Pressable accessibilityLabel={t('client.calendar.nav.next')} onPress={onNext}>
        <Text style={styles.navBtn}>{'›'}</Text>
      </Pressable>
    </View>
  );
}

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function WeekdayHeader(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.weekdayRow}>
      {WEEKDAY_KEYS.map((d) => (
        <Text key={d} style={styles.weekdayLabel}>
          {t(`client.calendar.weekday.${d}`)}
        </Text>
      ))}
    </View>
  );
}

type DayCellProps = {
  cell: GridCell;
  data: DayData | undefined;
  isToday: boolean;
  onPress: (dateStr: string) => void;
};

export function DayCell({ cell, data, isToday, onPress }: DayCellProps): React.JSX.Element {
  const fallback = data?.hasCompleted ? BG_COMPLETED : data?.hasPlanned ? BG_PLANNED : 'transparent';
  const cellBg = data?.workoutColor ?? fallback;
  const markers = [
    data?.coachNotes.length ? COACH_NOTE_COLOR : null,
    data?.call || data?.hasMeeting ? CALL_COLOR : null,
    data?.clientNote ? CLIENT_NOTE_COLOR : null,
  ].filter((color): color is string => Boolean(color));
  return (
    <Pressable onPress={() => onPress(cell.dateStr)} style={[styles.cell, { backgroundColor: cellBg }]}>
      <Text style={[styles.cellText, !cell.isCurrentMonth && styles.cellDim, isToday && styles.cellToday]}>
        {String(cell.date.getDate())}
      </Text>
      {markers.length > 0 ? (
        <View style={styles.markerRow}>
          {markers.map((color) => (
            <View key={color} style={[styles.marker, { backgroundColor: color }]} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

type MonthGridProps = {
  cells: GridCell[];
  dayData: Map<string, DayData>;
  onSelectDay: (dateStr: string) => void;
  todayStr: string;
};

export function MonthGrid({ cells, dayData, onSelectDay, todayStr }: MonthGridProps): React.JSX.Element {
  return (
    <View>
      <WeekdayHeader />
      <View style={styles.grid}>
        {cells.map((cell) => (
          <DayCell
            key={cell.dateStr}
            cell={cell}
            data={dayData.get(cell.dateStr)}
            isToday={cell.dateStr === todayStr}
            onPress={onSelectDay}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: '14.28%',
  },
  cellDim: { color: TEXT_DIM },
  cellText: { color: TEXT_MAIN, fontSize: 14, fontWeight: '500' },
  cellToday: { fontWeight: '700', textDecorationLine: 'underline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  marker: { borderRadius: 3, height: 6, width: 6 },
  markerRow: { flexDirection: 'row', gap: 2, position: 'absolute', right: 3, top: 3 },
  meetingDot: {
    backgroundColor: LIGHT.amber,
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    right: 4,
    top: 4,
    width: 6,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  monthLabel: { color: TEXT_MAIN, fontSize: 16, fontWeight: '600' },
  navBtn: { color: LIGHT.accent, fontSize: 24, paddingHorizontal: 12 },
  weekdayLabel: { color: LIGHT.textMuted, fontSize: 12, textAlign: 'center', width: '14.28%' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
});
