import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useExportReportPdfMutation } from '../../data/hooks/useExportReportPdf';
import {
  useClientWellnessQuery,
  type ClientWellnessResponse,
  type ClientWellnessSession,
  type ClientWellnessSummary,
  type ClientWellnessWeeklyReport,
} from '../../data/hooks/useClientWellness';
import { buildDefaultWellnessRange, formatDateLabel, formatScore, hasWellnessData } from './client-mood.helpers';

type Props = {
  clientId: string;
  clientName: string;
  onBack: () => void;
};

export function ClientMoodScreen(props: Props): React.JSX.Element {
  const vm = useClientMoodViewModel(props);
  return <ClientMoodView {...vm} />;
}

function useClientMoodViewModel(props: Props) {
  const { t } = useTranslation();
  const range = useMemo(() => buildDefaultWellnessRange(), []);
  const query = useClientWellnessQuery(props.clientId, range.dateFrom, range.dateTo);
  const exportMutation = useExportReportPdfMutation();

  return {
    clientName: props.clientName,
    exportError: exportMutation.isError,
    exporting: exportMutation.isPending,
    isError: query.isError,
    isLoading: query.isLoading,
    onBack: props.onBack,
    onExport: () => exportMutation.mutate({ clientId: props.clientId, from: range.dateFrom, to: range.dateTo }),
    t,
    wellness: query.data ?? null,
  };
}

type ViewModel = ReturnType<typeof useClientMoodViewModel>;

function ClientMoodView(props: ViewModel): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{props.t('coach.mood.title')}</Text>
        <Text style={styles.subtitle}>{props.clientName}</Text>
      </View>
      <Pressable
        disabled={props.exporting}
        onPress={props.onExport}
        style={[styles.exportBtn, props.exporting ? styles.exportBtnDisabled : null]}
      >
        <Text style={styles.exportLabel}>
          {props.exporting ? props.t('coach.mood.exporting') : props.t('coach.mood.exportPdf')}
        </Text>
      </Pressable>
      {props.exportError ? <Text style={styles.error}>{props.t('coach.mood.exportError')}</Text> : null}
      {renderBody(props)}
    </ScrollView>
  );
}

function renderBody(props: ViewModel): React.JSX.Element {
  if (props.isLoading) {
    return <Text style={styles.empty}>{props.t('coach.mood.loading')}</Text>;
  }
  if (props.isError || !props.wellness) {
    return <Text style={styles.error}>{props.t('coach.mood.error')}</Text>;
  }
  const isEmpty = props.wellness.summary.sessionsWithWellness === 0 && props.wellness.summary.reportsCount === 0;
  if (isEmpty) {
    return <Text style={styles.empty}>{props.t('coach.mood.empty')}</Text>;
  }
  return <WellnessBody t={props.t} wellness={props.wellness} />;
}

function WellnessBody(props: { t: ViewModel['t']; wellness: ClientWellnessResponse }): React.JSX.Element {
  return (
    <>
      <KpiStrip summary={props.wellness.summary} t={props.t} />
      <SessionList sessions={props.wellness.sessions} t={props.t} />
      <WeeklyList reports={props.wellness.weeklyReports} t={props.t} />
    </>
  );
}

function KpiStrip(props: { summary: ClientWellnessSummary; t: ViewModel['t'] }): React.JSX.Element {
  const items = [
    { id: 'mood', label: props.t('coach.mood.kpi.avgMood'), value: formatScore(props.summary.avgPostMood) },
    {
      id: 'motivation',
      label: props.t('coach.mood.kpi.avgMotivation'),
      value: formatScore(props.summary.avgPreMotivation),
    },
    { id: 'fatigue', label: props.t('coach.mood.kpi.avgFatigue'), value: formatScore(props.summary.avgPostFatigue) },
    { id: 'sessions', label: props.t('coach.mood.kpi.sessionsCount'), value: String(props.summary.sessionsWithWellness) },
  ];
  return (
    <View style={styles.kpiRow}>
      {items.map((item) => (
        <View key={item.id} style={styles.kpiChip}>
          <Text style={styles.kpiValue}>{item.value}</Text>
          <Text style={styles.kpiLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function SessionList(props: { sessions: ClientWellnessSession[]; t: ViewModel['t'] }): React.JSX.Element {
  const withData = props.sessions.filter(hasWellnessData);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{props.t('coach.mood.sections.sessions')}</Text>
      {withData.length === 0 ? <Text style={styles.empty}>{props.t('coach.mood.empty')}</Text> : null}
      {withData.map((session) => (
        <View key={session.id} style={styles.card}>
          <Text style={styles.cardTitle}>{session.planDayTitle ?? formatDateLabel(session.sessionDate)}</Text>
          <Text style={styles.cardMeta}>{formatDateLabel(session.sessionDate)}</Text>
          <View style={styles.metrics}>
            <Metric label={props.t('coach.mood.fields.motivation')} value={formatScore(session.preMotivation)} />
            <Metric label={props.t('coach.mood.fields.recovery')} value={formatScore(session.preRecovery)} />
            <Metric label={props.t('coach.mood.fields.fatigue')} value={formatScore(session.postFatigue)} />
            <Metric label={props.t('coach.mood.fields.pain')} value={formatScore(session.postPain)} />
          </View>
        </View>
      ))}
    </View>
  );
}

function WeeklyList(props: { reports: ClientWellnessWeeklyReport[]; t: ViewModel['t'] }): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{props.t('coach.mood.sections.weeklyReports')}</Text>
      {props.reports.length === 0 ? <Text style={styles.empty}>{props.t('coach.mood.empty')}</Text> : null}
      {props.reports.map((report) => (
        <View key={report.id} style={styles.card}>
          <Text style={styles.cardTitle}>{props.t('coach.mood.weeklyReport.weekOf', { date: report.weekStartDate })}</Text>
          <View style={styles.metrics}>
            <Metric label={props.t('coach.mood.fields.mood')} value={formatScore(report.mood)} />
            <Metric label={props.t('coach.mood.fields.energy')} value={formatScore(report.energy)} />
            <Metric label={props.t('coach.mood.fields.sleep')} value={formatScore(report.sleepHours)} />
            <Metric label={props.t('coach.mood.fields.adherence')} value={formatScore(report.adherencePercent)} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Metric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4f0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  cardMeta: { color: '#627285', fontSize: 12 },
  cardTitle: { color: '#0e1a2f', fontSize: 16, fontWeight: '700' },
  empty: { color: '#627285', fontSize: 14, paddingVertical: 12 },
  error: { color: '#dc2626', fontSize: 14 },
  exportBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#225fdb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exportBtnDisabled: { opacity: 0.6 },
  exportLabel: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  header: { gap: 4 },
  kpiChip: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe4f0',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 12,
  },
  kpiLabel: { color: '#627285', fontSize: 11, marginTop: 4, textAlign: 'center' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiValue: { color: '#0e1a2f', fontSize: 20, fontWeight: '800' },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { color: '#627285', fontSize: 10, textTransform: 'uppercase' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metricValue: { color: '#0e1a2f', fontSize: 14, fontWeight: '700' },
  page: { gap: 14, paddingBottom: 24 },
  section: { gap: 8 },
  sectionTitle: { color: '#627285', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  subtitle: { color: '#627285', fontSize: 14 },
  title: { color: '#0e1a2f', fontSize: 24, fontWeight: '700' },
});
