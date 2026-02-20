import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarsChart, SummaryStrip } from '@trainerpro/ui';
import '../../i18n';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import { useExportReportPdfMutation } from '../../data/hooks/useExportReportPdf';
import { useProgressOverviewQuery } from '../../data/hooks/useProgressQuery';
import { ClientSelectionStrip } from './components/ClientSelectionStrip';

const COLORS = {
  bg: '#eef4fb',
  muted: '#5d6f85',
  text: '#0f1b2f',
};

export function ProgressScreen(): React.JSX.Element {
  const vm = useProgressViewModel();
  return <ProgressView {...vm} />;
}

function useProgressViewModel() {
  const { t } = useTranslation();
  const clientsQuery = useClientsQuery();
  const [clientId, setClientId] = useClientSelection(clientsQuery.data);
  const range = useMemo(() => buildRange(), []);
  const progressQuery = useProgressQuery(clientId, range.from, range.to);
  const exportPdfMutation = useExportReportPdfMutation();
  const clientItems = useMemo(() => mapClientItems(clientsQuery.data ?? []), [clientsQuery.data]);
  const summaryItems = useMemo(() => buildSummary(progressQuery.data, t), [progressQuery.data, t]);
  const strengthBars = useMemo(() => buildStrengthBars(progressQuery.data), [progressQuery.data]);
  const cardioBars = useMemo(() => buildCardioBars(progressQuery.data), [progressQuery.data]);
  const exportState = buildExportState(clientId, progressQuery.isLoading, exportPdfMutation, range);
  return {
    ...exportState,
    cardioBars,
    clientId,
    clientItems,
    clientsQuery,
    exportPdfMutation: exportState.exportPdfMutation,
    progressQuery,
    setClientId,
    strengthBars,
    summaryItems,
    t,
  };
}

function useClientSelection(clients: Array<{ id: string }> | undefined) {
  const [clientId, setClientId] = useState('');
  useEffect(() => {
    const firstClient = clients?.[0]?.id;
    if (firstClient && !clientId) {
      setClientId(firstClient);
    }
  }, [clientId, clients]);
  return [clientId, setClientId] as const;
}

function useProgressQuery(clientId: string, from: string, to: string) {
  return useProgressOverviewQuery({ clientId, from, to }, { enabled: clientId.length > 0 });
}

type ViewModel = ReturnType<typeof useProgressViewModel>;

function ProgressView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.progress.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.progress.subtitle')}</Text>
      <ExportAction {...props} />
      <ClientSelector {...props} />
      <ContentState {...props} />
    </ScrollView>
  );
}

function ExportAction(props: ViewModel) {
  const buttonLabel = props.exportPdfMutation.isPending
    ? props.t('coach.progress.export.loading')
    : props.t('coach.progress.export.button');
  return (
    <View style={styles.exportWrap}>
      <Pressable
        disabled={!props.canExport}
        onPress={props.exportPdf}
        style={[styles.exportButton, !props.canExport && styles.exportButtonDisabled]}
      >
        <Text style={styles.exportButtonText}>{buttonLabel}</Text>
      </Pressable>
      {props.exportPdfMutation.isError ? (
        <Text style={styles.exportError}>{props.t('coach.progress.export.error')}</Text>
      ) : null}
    </View>
  );
}

function buildExportState(
  clientId: string,
  isProgressLoading: boolean,
  exportPdfMutation: ReturnType<typeof useExportReportPdfMutation>,
  range: { from: string; to: string },
) {
  const canExport = clientId.length > 0 && !isProgressLoading && !exportPdfMutation.isPending;
  const exportPdf = () => {
    if (!clientId) {
      return;
    }
    exportPdfMutation.mutate({ clientId, from: range.from, to: range.to });
  };
  return { canExport, exportPdf, exportPdfMutation };
}

function ClientSelector(props: ViewModel) {
  return (
    <ClientSelectionStrip
      emptyLabel={props.t('coach.progress.emptyClients')}
      items={props.clientItems}
      loading={props.clientsQuery.isLoading}
      onSelect={props.setClientId}
      selectedId={props.clientId}
      showArrows
    />
  );
}

function ContentState(props: ViewModel) {
  if (props.progressQuery.isLoading) {
    return <ActivityIndicator />;
  }
  if (props.progressQuery.isError) {
    return <Text style={styles.info}>{props.t('coach.progress.error')}</Text>;
  }
  return (
    <View style={styles.stack}>
      <SummaryStrip items={props.summaryItems} />
      <BarsChart
        bars={props.strengthBars}
        emptyLabel={props.t('coach.progress.empty')}
        title={props.t('coach.progress.strengthChart')}
      />
      <BarsChart
        bars={props.cardioBars}
        emptyLabel={props.t('coach.progress.empty')}
        title={props.t('coach.progress.cardioChart')}
      />
    </View>
  );
}

function mapClientItems(
  clients: Array<{
    avatarUrl: null | string;
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  }>,
) {
  return clients.map((client) => ({
    avatarUrl: client.avatarUrl,
    email: client.email,
    id: client.id,
    name: `${client.firstName} ${client.lastName}`.trim(),
  }));
}

function buildSummary(
  data: ReturnType<typeof useProgressOverviewQuery>['data'],
  t: (key: string) => string,
) {
  const volume = (data?.strengthWeekly ?? []).reduce((sum, point) => sum + point.volumeKg, 0);
  const duration = (data?.cardioWeekly ?? []).reduce(
    (sum, point) => sum + point.totalDurationSeconds,
    0,
  );
  const srpe = (data?.srpeWeekly ?? []).reduce((sum, point) => sum + point.totalSrpe, 0);
  return [
    { id: 'volume', label: t('coach.progress.kpi.volumeKg'), value: `${Math.round(volume)}` },
    {
      id: 'duration',
      label: t('coach.progress.kpi.timeMin'),
      value: `${Math.round(duration / 60)}`,
    },
    { id: 'srpe', label: t('coach.progress.kpi.srpe'), value: `${Math.round(srpe)}` },
  ];
}

function buildStrengthBars(data: ReturnType<typeof useProgressOverviewQuery>['data']) {
  return (data?.strengthWeekly ?? []).map((point) => ({
    id: `${point.weekStart}-${point.muscleGroup}`,
    label: point.muscleGroup.slice(0, 3).toUpperCase(),
    value: point.volumeKg,
  }));
}

function buildCardioBars(data: ReturnType<typeof useProgressOverviewQuery>['data']) {
  return (data?.cardioWeekly ?? []).map((point) => ({
    id: `${point.weekStart}-${point.methodType}`,
    label: point.methodType.slice(0, 3).toUpperCase(),
    value: point.totalDurationSeconds / 60,
  }));
}

function buildRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 56);
  return { from: toDateString(from), to: toDateString(to) };
}

function toDateString(input: Date): string {
  return input.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  exportButton: {
    alignItems: 'center',
    backgroundColor: '#f0f2f4',
    borderColor: '#dce0e5',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  exportButtonDisabled: {
    opacity: 0.55,
  },
  exportButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  exportError: {
    color: '#b91c1c',
    fontSize: 12,
  },
  exportWrap: {
    alignItems: 'flex-end',
    gap: 6,
    width: '100%',
  },
  info: {
    color: COLORS.muted,
    fontSize: 14,
    width: '100%',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    minHeight: '100%',
    padding: 20,
  },
  stack: {
    gap: 12,
    width: '100%',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%',
  },
});
