import { buildMetricChartData, metricTooltipTitle } from './metric-chart-presentation';
import { getLayoutStyle1, getLayoutStyle2 } from './MetricDetailModal.layout-styles';
import { WebBox, WebText } from '@trainerpro/ui';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { metricSamples, metricCoverageLines } from './metric-samples';
import type { VariableDef } from './progress-screen.types';
import type { ExerciseProgressPoint } from '../../../data/hooks/useExerciseProgressQuery';
import { Button, Modal, colors, fontSize, radius, space } from '@trainerpro/ui';
type Props = {
  visible: boolean;
  onClose: () => void;
  variable: VariableDef | null;
  exerciseName?: string;
  data: ExerciseProgressPoint[];
};
// eslint-disable-next-line max-lines-per-function
export function MetricDetailModal({ visible, onClose, variable, exerciseName, data }: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const fullSize = '100%';
  const axisZero = '0';
  const axisOne = '1';
  const lineDash = '3 3';
  const gradStart = '5%';
  const gradEnd = '95%';
  const dateKey = 'date';
  const valueKey = 'value';
  const chartType = 'monotone';
  const detailGradId = 'detailGrad';
  const chartFill = `url(#${detailGradId})`;
  const gridColor = colors.background;
  const detailTitle = t('coach.progress.modal.detailTitleWithMetric').replace('{metric}', t(variable?.labelKey ?? ''));
  const setRepsSeparator = t('coach.progress.modal.setRepsSeparator');
  const dotSeparator = t('coach.progress.modal.dotSeparator');
  if (!visible || !variable) return null;
  const chartData = buildMetricChartData(data, 'sessionDate', variable.dataKey);
  const selectedPoint = data[selectedIdx];
  const sets = selectedPoint?.setDetails ?? [];
  const samples = metricSamples(data, variable.dataKey);
  const avgVal = samples.average;
  const maxVal = samples.max;
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  return (
    <Modal closeLabel={t('common.close')} onClose={onClose} size="xl" title={detailTitle} visible={visible}>
      <WebBox style={modalBody}>
        <WebText style={modalSubtitle}>{exerciseName ?? ''}</WebText>

        {/* KPI tiles */}
        <WebBox style={kpiRow}>
          <KpiTile label={t('coach.progress.kpi.sessions')} value={`${data.length}`} />
          <KpiTile
            label={`${t('coach.progress.kpi.avgPrefix')} ${t(variable.labelKey)}`}
            value={avgVal == null ? '—' : `${Math.round(avgVal * 10) / 10} ${variable.unit}`}
          />
          <KpiTile
            label={t('coach.progress.kpi.max')}
            value={maxVal == null ? '—' : `${Math.round(maxVal * 10) / 10} ${variable.unit}`}
          />
        </WebBox>

        {metricCoverageLines(data, variable.dataKey, t).map((line, index) => (
          <WebText key={index}>{line}</WebText>
        ))}
        {/* Main chart */}
        <WebBox style={chartContainer}>
          <WebText style={sectionLabel}>
            {t('coach.progress.modal.progressOf').replace('{metric}', t(variable.labelKey))}
          </WebText>
          <WebBox style={layoutStyle1}>
            <ResponsiveContainer width={fullSize} height={fullSize}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={detailGradId} x1={axisZero} y1={axisZero} x2={axisZero} y2={axisOne}>
                    <stop offset={gradStart} stopColor={variable.color} stopOpacity={0.25} />
                    <stop offset={gradEnd} stopColor={variable.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray={lineDash} stroke={gridColor} />
                <XAxis
                  dataKey={dateKey}
                  tickFormatter={(date: string) => date.slice(5)}
                  tick={{ fontSize: fontSize.xs, fill: colors.textMuted }}
                />
                <YAxis tick={{ fontSize: fontSize.xs, fill: colors.textMuted }} />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: space.sm }}
                  labelStyle={{ color: colors.text }}
                  itemStyle={{ color: colors.text }}
                  labelFormatter={(label, payload) => metricTooltipTitle(label, payload, t)}
                  formatter={(v) => [
                    v == null ? '—' : `${Math.round(Number(v) * 10) / 10} ${variable.unit}`,
                    t(variable.labelKey),
                  ]}
                />
                <Area
                  type={chartType}
                  dataKey={valueKey}
                  stroke={variable.color}
                  fill={chartFill}
                  strokeWidth={2}
                  dot={{ r: 4, fill: variable.color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </WebBox>
        </WebBox>

        {/* Two-panel: sessions list + set breakdown */}
        <WebBox style={twoPanel}>
          {/* Sessions list */}
          <WebBox style={sessionsList}>
            <WebText style={sectionLabel}>{t('coach.progress.modal.sessions.title')}</WebText>
            {data.map((pt, idx) => (
              <Button
                key={pt.sessionId}
                label={
                  pt.sessionDate.slice(0, 10) +
                  (pt.outcome ? ' · ' + t('training.outcome.' + pt.outcome) : '') +
                  ' · ' +
                  ((pt as Record<string, unknown>)[variable.dataKey] == null
                    ? '—'
                    : Math.round(Number((pt as Record<string, unknown>)[variable.dataKey]) * 10) / 10) +
                  ' ' +
                  variable.unit
                }
                onPress={() => setSelectedIdx(idx)}
                variant={idx === selectedIdx ? 'primary' : 'secondary'}
                size="sm"
              />
            ))}
          </WebBox>

          {/* Set breakdown */}
          <WebBox style={setsPanel}>
            <WebText style={sectionLabel}>{t('coach.progress.modal.sets.title')}</WebText>
            {selectedPoint ? (
              <WebText>{metricTooltipTitle(selectedPoint.sessionDate, [{ payload: chartData[selectedIdx] }], t)}</WebText>
            ) : null}
            {sets.length === 0 && <WebText style={layoutStyle2}>{t('coach.progress.modal.noData')}</WebText>}
            {sets.map((set) => (
              <WebBox key={set.setIndex} style={setRow}>
                <WebText style={setNum}>
                  {t('coach.progress.modal.setLabel').replace('{index}', String(set.setIndex))}
                </WebText>
                <WebText style={setDetail}>
                  {set.weightKg !== null ? `${set.weightKg}kg` : t('coach.progress.modal.na')} {setRepsSeparator}{' '}
                  {set.reps ?? t('coach.progress.modal.na')} {t('coach.progress.modal.reps')}
                  {set.rpe !== null ? ` ${dotSeparator} ${t('coach.progress.modal.rpeLabel')} ${set.rpe}` : ''}
                </WebText>
                {set.e1rm !== null && (
                  <WebText style={setMeta}>
                    {t('coach.progress.modal.e1rmValue').replace('{value}', String(Math.round(set.e1rm)))}
                  </WebText>
                )}
              </WebBox>
            ))}

            {/* Insight */}
            <WebBox style={insightBox}>
              <WebText style={insightText}>{t('coach.progress.modal.insightText')}</WebText>
            </WebBox>
          </WebBox>
        </WebBox>
      </WebBox>
    </Modal>
  );
}
function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <WebBox style={kpiTile}>
      <WebText style={kpiLabel}>{label}</WebText>
      <WebText style={kpiValue}>{value}</WebText>
    </WebBox>
  );
}
// Styles
const modalBody: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: space.xl,
};
const modalSubtitle: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, color: colors.textMuted, fontWeight: 600 };
const kpiRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
  gap: space.lg,
};
const kpiTile: React.CSSProperties = {
  background: colors.surfaceMuted,
  borderRadius: 16,
  padding: '18px 20px',
  border: `1px solid ${colors.background}`,
};
const kpiLabel: React.CSSProperties = {
  margin: 0,
  fontSize: fontSize.xs,
  fontWeight: 800,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const kpiValue: React.CSSProperties = { margin: '6px 0 0', fontSize: fontSize.xl, fontWeight: 900, color: colors.text };
const chartContainer: React.CSSProperties = {
  background: colors.surfaceMuted,
  borderRadius: 20,
  padding: '20px 16px',
  border: `1px solid ${colors.background}`,
};
const sectionLabel: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: fontSize.sm,
  fontWeight: 800,
  color: colors.text,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};
const twoPanel: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
  gap: space.xl,
};
const sessionsList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: space.sm,
};

const setsPanel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: space.sm,
};
const setRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.md,
  padding: '10px 14px',
  borderRadius: radius.lg,
  background: colors.surfaceMuted,
  border: `1px solid ${colors.background}`,
};
const setNum: React.CSSProperties = { fontSize: fontSize.xs, fontWeight: 800, color: colors.textMuted, minWidth: 56 };
const setDetail: React.CSSProperties = { fontSize: fontSize.sm, fontWeight: 700, color: colors.text, flex: 1 };
const setMeta: React.CSSProperties = { fontSize: fontSize.xs, fontWeight: 700, color: colors.primary };
const insightBox: React.CSSProperties = {
  marginTop: space.md,
  padding: '14px 16px',
  borderRadius: radius.lg,
  background: colors.warningSoft,
  border: `1.5px solid ${colors.warningSoft}`,
};
const insightText: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, fontWeight: 600, color: colors.warning };
