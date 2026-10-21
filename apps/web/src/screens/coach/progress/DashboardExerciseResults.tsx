import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@trainerpro/ui';
import { DashboardChart, type DashboardMetric } from './DashboardChart';
import { DashboardPdf } from './DashboardPdf';
import { dashboardStyles as styles } from './dashboard.styles';
import type { DashboardPoint } from './dashboard-model';

export function DashboardExerciseResults(props: {
  kpis: { key: string; value: string }[];
  metrics: DashboardMetric[];
  active: string[];
  visible: DashboardMetric[];
  points: DashboardPoint[];
  context: string[];
  clientName: string;
  title: string;
  onToggle: (key: string) => void;
  onDetail: (metric: DashboardMetric) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.column}>
      <View style={styles.grid}>
        {props.kpis.map((kpi) => (
          <View key={kpi.key} style={[styles.panel, styles.kpi]}>
            <Text style={styles.muted}>{t(`progressDashboard.${kpi.key}`)}</Text>
            <Text style={styles.metric}>{kpi.value}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.muted}>{t('progressDashboard.openMetrics')}</Text>
      <View style={styles.row}>
        {props.metrics.map((metric) => (
          <Button
            key={metric.key}
            label={t(`progressDashboard.${metric.key}`)}
            onPress={() => props.onToggle(metric.key)}
            variant={props.active.includes(metric.key) ? 'primary' : 'secondary'}
            size="sm"
          />
        ))}
      </View>
      <DashboardPdf
        clientName={props.clientName}
        title={props.title}
        points={props.points}
        metrics={props.visible}
        context={props.context}
      />
      <View style={styles.grid}>
        {props.visible.map((metric) => (
          <DashboardChart
            key={metric.key}
            metric={metric}
            points={props.points}
            onDetail={() => props.onDetail(metric)}
            onClose={() => props.onToggle(metric.key)}
          />
        ))}
      </View>
    </View>
  );
}
