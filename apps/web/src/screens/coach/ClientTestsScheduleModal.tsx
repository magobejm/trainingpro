import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiClientError } from '../../data/api-client';
import { useSchedulePhysicalTestMutation, type PhysicalTestView } from '../../data/hooks/usePhysicalTests';

type Props = {
  clientId: string;
  onClose: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  test: PhysicalTestView | null;
};

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MODAL_FADE = 'fade' as const;

export function ScheduleTestModal(props: Props): React.JSX.Element {
  const schedule = useSchedulePhysicalTestMutation(props.clientId);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => formatDate(new Date()));
  const [notice, setNotice] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);

  const submit = async (confirmed: boolean) => {
    if (!props.test) return;
    setNotice(null);
    try {
      await schedule.mutateAsync({ date: selected, physicalTestId: props.test.id, replace: confirmed });
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
    <Modal animationType={MODAL_FADE} onRequestClose={props.onClose} transparent visible={Boolean(props.test)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.t('coach.tests.schedule.title')}</Text>
          {props.test ? <Text style={styles.subtitle}>{props.test.name}</Text> : null}
          <MonthPicker month={month} onMonth={setMonth} onSelect={setSelected} selected={selected} />
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={props.onClose} style={styles.secondary}>
              <Text style={styles.secondaryLabel}>{props.t('common.cancel')}</Text>
            </Pressable>
            <Pressable disabled={schedule.isPending} onPress={() => void submit(replace)} style={styles.primary}>
              <Text style={styles.primaryLabel}>
                {replace ? props.t('coach.tests.schedule.replaceAction') : props.t('coach.tests.schedule.confirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MonthPicker(props: {
  month: Date;
  onMonth: (month: Date) => void;
  onSelect: (date: string) => void;
  selected: string;
}): React.JSX.Element {
  const cells = monthCells(props.month);
  const label = props.month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return (
    <View>
      <View style={styles.monthRow}>
        <Pressable onPress={() => props.onMonth(shiftMonth(props.month, -1))}>
          <Text style={styles.nav}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{label}</Text>
        <Pressable onPress={() => props.onMonth(shiftMonth(props.month, 1))}>
          <Text style={styles.nav}>{'›'}</Text>
        </Pressable>
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
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, maxWidth: 420, padding: 16, width: '100%' },
  day: { alignItems: 'center', width: '14.28%' },
  daySelected: { backgroundColor: '#225fdb', borderRadius: 12, color: '#fff', overflow: 'hidden' },
  dayText: { color: '#0e1a2f', fontSize: 13, paddingVertical: 6, textAlign: 'center', width: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthLabel: { color: '#0e1a2f', fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  nav: { color: '#225fdb', fontSize: 22, paddingHorizontal: 8 },
  notice: { color: '#9a3412', fontSize: 13, marginTop: 8 },
  overlay: { alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.45)', flex: 1, justifyContent: 'center', padding: 16 },
  primary: { backgroundColor: '#225fdb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryLabel: { color: '#fff', fontWeight: '700' },
  secondary: { borderColor: '#dbe4f0', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryLabel: { color: '#334155', fontWeight: '600' },
  subtitle: { color: '#627285', marginBottom: 8 },
  title: { color: '#0e1a2f', fontSize: 18, fontWeight: '700' },
  weekday: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textAlign: 'center', width: '14.28%' },
});
