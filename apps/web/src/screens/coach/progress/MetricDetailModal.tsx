import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VariableDef } from './progress-screen.types';
import type { ExerciseProgressPoint } from '../../../data/hooks/useExerciseProgressQuery';

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
  const gridColor = '#f0f4f8';
  const detailTitle = t('coach.progress.modal.detailTitleWithMetric').replace('{metric}', t(variable?.labelKey ?? ''));
  const setRepsSeparator = t('coach.progress.modal.setRepsSeparator');
  const dotSeparator = t('coach.progress.modal.dotSeparator');

  if (!visible || !variable) return null;

  const chartData = data.map((pt) => ({
    date: pt.sessionDate.slice(5),
    value: (pt as Record<string, unknown>)[variable.dataKey] ?? 0,
  }));

  const selectedPoint = data[selectedIdx];
  const sets = selectedPoint?.setDetails ?? [];

  const avgVal =
    data.length > 0
      ? data.reduce((s, pt) => {
          const v = (pt as Record<string, unknown>)[variable.dataKey];
          return s + (typeof v === 'number' ? v : 0);
        }, 0) / data.length
      : 0;
  const maxVal =
    data.length > 0
      ? Math.max(
          ...data.map((pt) => {
            const v = (pt as Record<string, unknown>)[variable.dataKey];
            return typeof v === 'number' ? v : 0;
          }),
        )
      : 0;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <div>
            <h2 style={modalTitle}>{detailTitle}</h2>
            <p style={modalSubtitle}>{exerciseName ?? ''}</p>
          </div>
          <button style={closeBtn} onClick={onClose}>
            {t('common.modalCloseGlyph')}
          </button>
        </div>

        {/* KPI tiles */}
        <div style={kpiRow}>
          <KpiTile label={t('coach.progress.kpi.sessions')} value={`${data.length}`} />
          <KpiTile
            label={`${t('coach.progress.kpi.avgPrefix')} ${t(variable.labelKey)}`}
            value={`${Math.round(avgVal * 10) / 10} ${variable.unit}`}
          />
          <KpiTile label={t('coach.progress.kpi.max')} value={`${Math.round(maxVal * 10) / 10} ${variable.unit}`} />
        </div>

        {/* Main chart */}
        <div style={chartContainer}>
          <p style={sectionLabel}>{t('coach.progress.modal.progressOf').replace('{metric}', t(variable.labelKey))}</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width={fullSize} height={fullSize}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={detailGradId} x1={axisZero} y1={axisZero} x2={axisZero} y2={axisOne}>
                    <stop offset={gradStart} stopColor={variable.color} stopOpacity={0.25} />
                    <stop offset={gradEnd} stopColor={variable.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray={lineDash} stroke={gridColor} />
                <XAxis dataKey={dateKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${Math.round((Number(v) || 0) * 10) / 10} ${variable.unit}`, t(variable.labelKey)]}
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
          </div>
        </div>

        {/* Two-panel: sessions list + set breakdown */}
        <div style={twoPanel}>
          {/* Sessions list */}
          <div style={sessionsList}>
            <p style={sectionLabel}>{t('coach.progress.modal.sessions.title')}</p>
            {data.map((pt, idx) => (
              <button
                key={pt.sessionId}
                style={{ ...sessionItem, ...(idx === selectedIdx ? sessionItemActive : {}) }}
                onClick={() => setSelectedIdx(idx)}
              >
                <span style={sessionDate}>{pt.sessionDate}</span>
                <span style={sessionValue}>
                  {Math.round((((pt as Record<string, unknown>)[variable.dataKey] as number) ?? 0) * 10) / 10}{' '}
                  {variable.unit}
                </span>
              </button>
            ))}
          </div>

          {/* Set breakdown */}
          <div style={setsPanel}>
            <p style={sectionLabel}>{t('coach.progress.modal.sets.title')}</p>
            {sets.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>{t('coach.progress.modal.noData')}</p>}
            {sets.map((set) => (
              <div key={set.setIndex} style={setRow}>
                <span style={setNum}>{t('coach.progress.modal.setLabel').replace('{index}', String(set.setIndex))}</span>
                <span style={setDetail}>
                  {set.weightKg !== null ? `${set.weightKg}kg` : t('coach.progress.modal.na')} {setRepsSeparator}{' '}
                  {set.reps ?? t('coach.progress.modal.na')} {t('coach.progress.modal.reps')}
                  {set.rpe !== null ? ` ${dotSeparator} ${t('coach.progress.modal.rpeLabel')} ${set.rpe}` : ''}
                </span>
                {set.e1rm !== null && (
                  <span style={setMeta}>
                    {t('coach.progress.modal.e1rmValue').replace('{value}', String(Math.round(set.e1rm)))}
                  </span>
                )}
              </div>
            ))}

            {/* Insight */}
            <div style={insightBox}>
              <p style={insightText}>{t('coach.progress.modal.insightText')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={kpiTile}>
      <p style={kpiLabel}>{label}</p>
      <p style={kpiValue}>{value}</p>
    </div>
  );
}

// Styles
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  background: 'rgba(15,27,47,0.55)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};
const modal: React.CSSProperties = {
  background: '#fff',
  borderRadius: 28,
  width: '100%',
  maxWidth: 960,
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 32,
  boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
};
const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};
const modalTitle: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 900, color: '#0f1b2f' };
const modalSubtitle: React.CSSProperties = { margin: 0, fontSize: 13, color: '#5d6f85', fontWeight: 600 };
const closeBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 12,
  border: 'none',
  background: '#f1f5f9',
  color: '#5d6f85',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 700,
};
const kpiRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
};
const kpiTile: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: 16,
  padding: '18px 20px',
  border: '1px solid #e8edf3',
};
const kpiLabel: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const kpiValue: React.CSSProperties = { margin: '6px 0 0', fontSize: 24, fontWeight: 900, color: '#0f1b2f' };
const chartContainer: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: 20,
  padding: '20px 16px',
  border: '1px solid #e8edf3',
};
const sectionLabel: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 800,
  color: '#0f1b2f',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};
const twoPanel: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1.5fr',
  gap: 20,
};
const sessionsList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
const sessionItem: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1.5px solid #e8edf3',
  background: '#fff',
  cursor: 'pointer',
  transition: 'all 0.15s',
};
const sessionItemActive: React.CSSProperties = {
  border: '1.5px solid #3b82f6',
  background: '#eff6ff',
};
const sessionDate: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#0f1b2f' };
const sessionValue: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#3b82f6' };
const setsPanel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};
const setRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 12,
  background: '#f8fafc',
  border: '1px solid #e8edf3',
};
const setNum: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#5d6f85', minWidth: 56 };
const setDetail: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#0f1b2f', flex: 1 };
const setMeta: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#3b82f6' };
const insightBox: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fffbeb',
  border: '1.5px solid #fde68a',
};
const insightText: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: '#92400e' };
