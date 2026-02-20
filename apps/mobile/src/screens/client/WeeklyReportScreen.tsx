import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useUpsertWeeklyReportMutation, useWeeklyReportQuery } from '../../data/hooks/useWeeklyReport';

type Props = {
  onClose?: () => void;
  sourceSessionId?: string;
};

const COLORS = {
  action: '#225fdb',
  bg: '#edf3fb',
  card: '#ffffff',
  input: '#f3f7fd',
  muted: '#627285',
  text: '#0e1a2f',
  white: '#ffffff',
};

export function WeeklyReportScreen(props: Props): React.JSX.Element {
  const vm = useWeeklyReportViewModel(props.sourceSessionId);
  return <WeeklyReportView {...vm} onClose={props.onClose} />;
}

function useWeeklyReportViewModel(sourceSessionId?: string) {
  const { t } = useTranslation();
  const reportDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const query = useWeeklyReportQuery(reportDate);
  const mutation = useUpsertWeeklyReportMutation();
  const fields = useWeeklyReportFields();
  useSyncReportFields(query.data, fields);
  const onSubmit = () => mutation.mutate(buildReportInput(fields, reportDate, sourceSessionId));
  return {
    ...fields,
    isLoading: query.isLoading,
    isSuccess: mutation.isSuccess,
    onSubmit,
    reportDate,
    t,
  };
}

function useWeeklyReportFields() {
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [adherencePercent, setAdherencePercent] = useState('');
  const [notes, setNotes] = useState('');
  return {
    adherencePercent,
    energy,
    mood,
    notes,
    setAdherencePercent,
    setEnergy,
    setMood,
    setNotes,
    setSleepHours,
    sleepHours,
  };
}

function useSyncReportFields(
  data: Awaited<ReturnType<typeof useWeeklyReportQuery>['data']>,
  fields: ReturnType<typeof useWeeklyReportFields>,
) {
  useEffect(() => {
    if (!data) {
      return;
    }
    fields.setMood(asString(data.mood));
    fields.setEnergy(asString(data.energy));
    fields.setSleepHours(asString(data.sleepHours));
    fields.setAdherencePercent(asString(data.adherencePercent));
    fields.setNotes(data.notes ?? '');
  }, [data]);
}

function buildReportInput(
  fields: ReturnType<typeof useWeeklyReportFields>,
  reportDate: string,
  sourceSessionId?: string,
) {
  return {
    adherencePercent: toNumber(fields.adherencePercent),
    energy: toNumber(fields.energy),
    mood: toNumber(fields.mood),
    notes: fields.notes || null,
    reportDate,
    sleepHours: toNumber(fields.sleepHours),
    sourceSessionId: sourceSessionId ?? null,
  };
}

type ViewModel = ReturnType<typeof useWeeklyReportViewModel> & { onClose?: () => void };

function WeeklyReportView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('client.report.title')}</Text>
      <Text style={styles.subtitle}>{props.t('client.report.subtitle')}</Text>
      <Text style={styles.meta}>{`${props.t('client.report.date')}: ${props.reportDate}`}</Text>
      <MetricsForm {...props} />
      <NotesForm {...props} />
      <Actions {...props} />
    </ScrollView>
  );
}

function MetricsForm(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Field label={props.t('client.report.mood')} value={props.mood} onChange={props.setMood} />
      <Field label={props.t('client.report.energy')} value={props.energy} onChange={props.setEnergy} />
      <Field
        label={props.t('client.report.sleepHours')}
        value={props.sleepHours}
        onChange={props.setSleepHours}
      />
      <Field
        label={props.t('client.report.adherence')}
        value={props.adherencePercent}
        onChange={props.setAdherencePercent}
      />
    </View>
  );
}

function NotesForm(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('client.report.notes')}</Text>
      <TextInput
        multiline
        onChangeText={props.setNotes}
        placeholder={props.t('client.report.notesPlaceholder')}
        style={styles.textArea}
        value={props.notes}
      />
    </View>
  );
}

function Actions(props: ViewModel) {
  return (
    <View style={styles.row}>
      {props.onClose ? (
        <Pressable onPress={props.onClose} style={styles.ghost}>
          <Text style={styles.ghostLabel}>{props.t('client.report.close')}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={props.onSubmit} style={styles.button}>
        <Text style={styles.buttonLabel}>{props.t('client.report.submit')}</Text>
      </Pressable>
      {props.isSuccess ? <Text style={styles.success}>{props.t('client.report.saved')}</Text> : null}
      {props.isLoading ? <Text style={styles.meta}>{props.t('client.report.loading')}</Text> : null}
    </View>
  );
}

function Field(props: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput onChangeText={props.onChange} style={styles.input} value={props.value} />
    </View>
  );
}

function asString(value: null | number): string {
  return value === null ? '' : `${value}`;
}

function toNumber(value: string): null | number {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  field: {
    gap: 6,
  },
  ghost: {
    alignItems: 'center',
    borderColor: '#d8e1ee',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  ghostLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    color: COLORS.muted,
    fontSize: 12,
    width: '100%',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 10,
    minHeight: '100%',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    width: '100%',
  },
  success: {
    color: COLORS.action,
    fontSize: 13,
    fontWeight: '700',
    width: '100%',
  },
  textArea: {
    backgroundColor: COLORS.input,
    borderRadius: 8,
    minHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    width: '100%',
  },
});
