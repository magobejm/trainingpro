import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarsChart, SummaryStrip } from '@trainerpro/ui';
import '../../i18n';
import { useProgressOverviewQuery } from '../../data/hooks/useProgressQuery';
import type { ProgressMode } from '../../shell/client/client-shell.constants';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';

const COLORS = {
  bg: '#07000f',
  muted: 'rgba(196,181,253,0.7)',
  text: '#ffffff',
};

const SPINNER_SIZE = 'small' as const;

type ProgressScreenProps = {
  mode?: ProgressMode;
  onClose: () => void;
};

export function ProgressScreen(props: ProgressScreenProps): React.JSX.Element {
  const mode = props.mode ?? 'progress';
  const vm = useProgressViewModel(mode);
  return <ProgressView mode={mode} onClose={props.onClose} {...vm} />;
}

function useProgressViewModel(mode: ProgressMode) {
  const { t } = useTranslation();
  const range = useMemo(() => buildRange(mode), [mode]);
  const query = useProgressOverviewQuery({ from: range.from, to: range.to });
  const summaryItems = useMemo(() => buildSummary(query.data, t), [query.data, t]);
  const strengthBars = useMemo(() => buildStrengthBars(query.data), [query.data]);
  const cardioBars = useMemo(() => buildCardioBars(query.data), [query.data]);
  return { cardioBars, query, strengthBars, summaryItems, t };
}

type ViewModel = ReturnType<typeof useProgressViewModel> & { mode: ProgressMode; onClose: () => void };

function ProgressView(props: ViewModel) {
  const titleKey = props.mode === 'volume' ? 'client.volume.title' : 'client.progress.title';
  const subtitleKey = props.mode === 'volume' ? 'client.volume.subtitle' : 'client.progress.subtitle';
  return (
    <View style={styles.root}>
      <OverlayBackHeader onClose={props.onClose} title={props.t(titleKey)} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.subtitle}>{props.t(subtitleKey)}</Text>
        {renderState(props)}
      </ScrollView>
    </View>
  );
}

function renderState(props: ViewModel) {
  if (props.query.isLoading) {
    return <ActivityIndicator size={SPINNER_SIZE} />;
  }
  if (props.query.isError) {
    return <Text style={styles.info}>{props.t('client.progress.error')}</Text>;
  }
  return (
    <View style={styles.stack}>
      <SummaryStrip items={props.summaryItems} />
      <BarsChart
        bars={props.strengthBars}
        emptyLabel={props.t('client.progress.empty')}
        title={props.t('client.progress.strengthChart')}
      />
      <BarsChart
        bars={props.cardioBars}
        emptyLabel={props.t('client.progress.empty')}
        title={props.t('client.progress.cardioChart')}
      />
    </View>
  );
}

function buildSummary(data: ReturnType<typeof useProgressOverviewQuery>['data'], t: (key: string) => string) {
  const volume = (data?.strengthWeekly ?? []).reduce((sum, point) => sum + point.volumeKg, 0);
  const duration = (data?.cardioWeekly ?? []).reduce((sum, point) => sum + point.totalDurationSeconds, 0);
  const srpe = (data?.srpeWeekly ?? []).reduce((sum, point) => sum + point.totalSrpe, 0);
  return [
    { id: 'volume', label: t('client.progress.kpi.volumeKg'), value: `${Math.round(volume)}` },
    { id: 'duration', label: t('client.progress.kpi.timeMin'), value: `${Math.round(duration / 60)}` },
    { id: 'srpe', label: t('client.progress.kpi.srpe'), value: `${Math.round(srpe)}` },
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

function buildRange(mode: ProgressMode) {
  const to = new Date();
  const from = new Date(to);
  const days = mode === 'volume' ? 28 : 56;
  from.setDate(from.getDate() - days);
  return { from: toDateString(from), to: toDateString(to) };
}

function toDateString(input: Date): string {
  return input.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  info: {
    color: COLORS.muted,
    fontSize: 14,
    width: '100%',
  },
  page: {
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  root: {
    backgroundColor: COLORS.bg,
    flex: 1,
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
});
