import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { dayChips, type DayChip, type DayData, type GridCell } from './client-calendar.helpers';
import { LIGHT } from '../../theme/light';
import { CALL_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';

const BG_PLANNED = LIGHT.accent;
const TEXT_DIM = LIGHT.textMuted;
const TEXT_MAIN = LIGHT.textStrong;

type MonthHeaderProps = {
  label: string;
  onBack?: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function MonthHeader({ label, onBack, onNext, onPrev }: MonthHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.monthHeader}>
      {onBack ? (
        <Pressable accessibilityLabel={t('client.calendar.detail.close')} onPress={onBack}>
          <Text style={styles.navBtn}>{'←'}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.monthLabel}>{label}</Text>
      <View style={styles.monthNav}>
        <Pressable accessibilityLabel={t('client.calendar.nav.prev')} onPress={onPrev}>
          <Text style={styles.navBtn}>{'‹'}</Text>
        </Pressable>
        <Pressable accessibilityLabel={t('client.calendar.nav.next')} onPress={onNext}>
          <Text style={styles.navBtn}>{'›'}</Text>
        </Pressable>
      </View>
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

const CHIP_BG: Record<DayChip['kind'], string> = {
  call: CALL_COLOR,
  notes: COACH_NOTE_COLOR,
  rest: '#dbeafe',
  test: '#312e81',
  workout: BG_PLANNED,
};

function chipLabel(chip: DayChip, t: (key: string) => string): string {
  if (chip.kind === 'rest') return t('client.calendar.chip.rest');
  if (chip.kind === 'call') return t('client.calendar.chip.call');
  if (chip.kind === 'notes') return t('client.calendar.chip.notes');
  if (chip.kind === 'test') return chip.text || t('client.calendar.chip.test');
  return chip.text || t('client.calendar.chip.workout');
}

export function DayCell({ cell, data, isToday, onPress }: DayCellProps): React.JSX.Element {
  const { t } = useTranslation();
  const chips = cell.isCurrentMonth ? dayChips(data) : [];
  return (
    <Pressable onPress={() => onPress(cell.dateStr)} style={[styles.cell, !cell.isCurrentMonth && styles.cellOutside]}>
      <Text style={[styles.cellText, !cell.isCurrentMonth && styles.cellDim, isToday && styles.cellToday]}>
        {String(cell.date.getDate())}
      </Text>
      {chips.map((chip) => (
        <Text
          key={chip.kind}
          numberOfLines={1}
          style={[
            styles.chip,
            { backgroundColor: chip.kind === 'workout' && data?.workoutColor ? data.workoutColor : CHIP_BG[chip.kind] },
            chip.kind === 'rest' && styles.chipRest,
          ]}
        >
          {chipLabel(chip, t)}
        </Text>
      ))}
    </Pressable>
  );
}

export function CalendarLegend(): React.JSX.Element {
  const { t } = useTranslation();
  const items: Array<{ color: string; label: string }> = [
    { color: CHIP_BG.test, label: t('client.calendar.chip.test') },
    { color: CHIP_BG.workout, label: t('client.calendar.chip.workout') },
    { color: CHIP_BG.rest, label: t('client.calendar.chip.rest') },
    { color: CHIP_BG.call, label: t('client.calendar.chip.call') },
    { color: CHIP_BG.notes, label: t('client.calendar.chip.notes') },
  ];
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
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
      <CalendarLegend />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 8,
    borderWidth: 1,
    boxSizing: 'border-box',
    flexGrow: 0,
    flexShrink: 0,
    gap: 2,
    marginBottom: 4,
    maxWidth: '14.28%',
    minHeight: 78,
    minWidth: 0,
    overflow: 'hidden',
    padding: 3,
    width: '14.28%',
  },
  cellOutside: { backgroundColor: 'transparent', borderColor: 'transparent' },
  chip: {
    borderRadius: 4,
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 2,
  },
  chipRest: { color: '#60a5fa' },
  cellDim: { color: TEXT_DIM },
  cellText: { color: TEXT_MAIN, fontSize: 14, fontWeight: '500' },
  cellToday: { fontWeight: '700', textDecorationLine: 'underline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 8, paddingTop: 8 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  legendLabel: { color: TEXT_MAIN, fontSize: 11, fontWeight: '600' },
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
    gap: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  monthNav: { flexDirection: 'row' },
  monthLabel: { color: TEXT_MAIN, fontSize: 16, fontWeight: '600' },
  navBtn: { color: LIGHT.accent, fontSize: 24, paddingHorizontal: 12 },
  weekdayLabel: {
    color: LIGHT.textMuted,
    flexGrow: 0,
    flexShrink: 0,
    fontSize: 12,
    maxWidth: '14.28%',
    minWidth: 0,
    textAlign: 'center',
    width: '14.28%',
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
});
