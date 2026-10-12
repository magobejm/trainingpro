import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Badge, Button, IconButton, Modal, colors, fontSize, space } from '@trainerpro/ui';
import { MONTH_NAMES_ES, DAY_NAMES_ES } from './calendar-screen.utils';
import type { CalendarClipboard } from './CalendarScreen.week-row';
type TFunc = (key: string, opts?: Record<string, unknown>) => string;
export type CalendarMonthHeaderProps = {
  year: number;
  month: number;
  clipboard: CalendarClipboard | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoTo: (year: number, month: number) => void;
  onClearClipboard: () => void;
  t: TFunc;
};
function MonthPicker({
  year,
  month,
  onGoTo,
  onClose,
  t,
}: {
  year: number;
  month: number;
  onGoTo: CalendarMonthHeaderProps['onGoTo'];
  onClose: () => void;
  t: TFunc;
}): React.JSX.Element {
  const [pickerYear, setPickerYear] = useState(year);
  return (
    <Modal title={String(pickerYear)} closeLabel={t('common.close')} onClose={onClose} size="sm" visible>
      <View style={styles.yearRow}>
        <IconButton
          accessibilityLabel={t('coach.calendar.header.prevYear')}
          icon={(color) => <ChevronLeft color={color} size={16} />}
          onPress={() => setPickerYear((value) => value - 1)}
        />
        <Text style={styles.year}>{pickerYear}</Text>
        <IconButton
          accessibilityLabel={t('coach.calendar.header.nextYear')}
          icon={(color) => <ChevronRight color={color} size={16} />}
          onPress={() => setPickerYear((value) => value + 1)}
        />
      </View>
      <View style={styles.months}>
        {MONTH_NAMES_ES.map((name, index) => (
          <Button
            key={name}
            label={name.slice(0, 3)}
            variant={pickerYear === year && index === month ? 'primary' : 'secondary'}
            size="sm"
            style={styles.month}
            onPress={() => {
              onGoTo(pickerYear, index);
              onClose();
            }}
          />
        ))}
      </View>
    </Modal>
  );
}
export function CalendarMonthHeader(props: CalendarMonthHeaderProps): React.JSX.Element {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <View style={styles.header}>
      <Button label={MONTH_NAMES_ES[props.month] + ' ' + props.year} onPress={() => setShowPicker(true)} variant="ghost" />
      {showPicker ? (
        <MonthPicker
          year={props.year}
          month={props.month}
          onGoTo={props.onGoTo}
          onClose={() => setShowPicker(false)}
          t={props.t}
        />
      ) : null}
      <View style={styles.actions}>
        {props.clipboard ? (
          <View style={styles.actions}>
            <Badge
              label={props.t(
                props.clipboard.type === 'week'
                  ? 'coach.calendar.clipboard.weekCopied'
                  : 'coach.calendar.clipboard.dayCopied',
              )}
              tone="primary"
            />
            <IconButton
              accessibilityLabel={props.t('coach.calendar.clipboard.clear')}
              icon={(color) => <X color={color} size={12} />}
              onPress={props.onClearClipboard}
              size={28}
            />
          </View>
        ) : null}
        <IconButton
          accessibilityLabel={props.t('coach.calendar.header.prevMonth')}
          icon={(color) => <ChevronLeft color={color} size={16} />}
          onPress={props.onPrevMonth}
          size={36}
        />
        <IconButton
          accessibilityLabel={props.t('coach.calendar.header.nextMonth')}
          icon={(color) => <ChevronRight color={color} size={16} />}
          onPress={props.onNextMonth}
          size={36}
        />
      </View>
    </View>
  );
}
export function CalendarDayNames(): React.JSX.Element {
  return (
    <View style={styles.days}>
      <View style={styles.gripSpace} />
      {DAY_NAMES_ES.map((day) => (
        <View key={day} style={styles.day}>
          <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: space.sm,
    padding: space.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  year: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  month: { flexBasis: '21%', flexGrow: 1 },
  days: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, flexShrink: 0 },
  gripSpace: { width: 20, flexShrink: 0 },
  day: { flex: 1, paddingVertical: space.md, alignItems: 'center' },
  dayText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
});
