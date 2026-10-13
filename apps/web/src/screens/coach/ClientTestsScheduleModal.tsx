import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiClientError } from '../../data/api-client';
import { useSchedulePhysicalTestMutation, type PhysicalTestView } from '../../data/hooks/usePhysicalTests';
import { Button, IconButton, Modal, colors, fontSize, radius, space, useToast } from '@trainerpro/ui';

type Props = {
  clientId: string;
  onClose: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  test: PhysicalTestView | null;
};

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const VARIANT_SECONDARY = 'secondary' as const;
const MODAL_SIZE = 'sm' as const;

export function ScheduleTestModal(props: Props): React.JSX.Element {
  const schedule = useSchedulePhysicalTestMutation(props.clientId);
  const toast = useToast();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => formatDate(new Date()));
  const [notice, setNotice] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);

  const submit = async (confirmed: boolean) => {
    if (!props.test) return;
    setNotice(null);
    try {
      await schedule.mutateAsync({ date: selected, physicalTestId: props.test.id, replace: confirmed });
      toast.success(props.t('coach.tests.schedule.success'));
      props.onClose();
    } catch (error) {
      const conflict = readScheduleConflict(error);
      if (conflict?.code === 'PHYSICAL_TEST_DAY_PENDING') {
        setReplace(true);
        setNotice(
          props.t('coach.tests.schedule.replace', { name: conflict.testName ?? props.t('coach.tests.schedule.other') }),
        );
        return;
      }
      if (conflict?.code === 'PHYSICAL_TEST_DAY_DONE') {
        setReplace(false);
        setNotice(props.t('coach.tests.schedule.done'));
        return;
      }
      setNotice(props.t('coach.tests.schedule.error'));
    }
  };

  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={
        <>
          <Button label={props.t('common.cancel')} onPress={props.onClose} variant={VARIANT_SECONDARY} />
          <Button
            label={replace ? props.t('coach.tests.schedule.replaceAction') : props.t('coach.tests.schedule.confirm')}
            loading={schedule.isPending}
            onPress={() => void submit(replace)}
          />
        </>
      }
      onClose={props.onClose}
      size={MODAL_SIZE}
      title={props.t('coach.tests.schedule.title')}
      visible={Boolean(props.test)}
    >
      {props.test ? <Text style={styles.subtitle}>{props.test.name}</Text> : null}
      <MonthPicker month={month} onMonth={setMonth} onSelect={setSelected} selected={selected} t={props.t} />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </Modal>
  );
}

function MonthPicker(props: {
  month: Date;
  onMonth: (month: Date) => void;
  onSelect: (date: string) => void;
  selected: string;
  t: Props['t'];
}): React.JSX.Element {
  const cells = monthCells(props.month);
  const label = props.month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return (
    <View>
      <View style={styles.monthRow}>
        <IconButton
          accessibilityLabel={props.t('coach.tests.schedule.prevMonth')}
          icon={(color) => <Text style={[styles.nav, { color }]}>{'‹'}</Text>}
          onPress={() => props.onMonth(shiftMonth(props.month, -1))}
        />
        <Text style={styles.monthLabel}>{label}</Text>
        <IconButton
          accessibilityLabel={props.t('coach.tests.schedule.nextMonth')}
          icon={(color) => <Text style={[styles.nav, { color }]}>{'›'}</Text>}
          onPress={() => props.onMonth(shiftMonth(props.month, 1))}
        />
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
        {cells.map((cell) => (
          <Pressable key={cell.key} onPress={() => props.onSelect(cell.date)} style={styles.day}>
            <Text style={[styles.dayText, cell.date === props.selected && styles.daySelected]}>{cell.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function readScheduleConflict(error: unknown): { code: string; testName?: string } | null {
  if (!(error instanceof ApiClientError) || error.status !== 409) return null;
  try {
    const body = JSON.parse(error.responseText) as { code?: string; testName?: string };
    return body.code ? { code: body.code, testName: body.testName } : null;
  } catch {
    return null;
  }
}

function monthCells(month: Date): Array<{ date: string; key: string; label: string }> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date: formatDate(date), key: formatDate(date), label: String(date.getDate()) };
  });
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const styles = StyleSheet.create({
  day: { alignItems: 'center', width: '14.28%' },
  daySelected: { backgroundColor: colors.primary, borderRadius: radius.lg, color: colors.onPrimary, overflow: 'hidden' },
  dayText: { color: colors.text, fontSize: fontSize.sm, paddingVertical: space.sm, textAlign: 'center', width: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', textTransform: 'capitalize' },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  nav: { fontSize: fontSize.xl, fontWeight: '700' },
  notice: { color: colors.danger, fontSize: fontSize.sm, marginTop: space.sm },
  subtitle: { color: colors.textMuted, marginBottom: space.sm },
  weekday: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center', width: '14.28%' },
});
