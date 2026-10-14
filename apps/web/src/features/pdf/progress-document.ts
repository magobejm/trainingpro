import type { CoachBranding } from '../../data/hooks/useBranding';
import type { AnalysisMode, DateRange, VariableDef } from '../../screens/coach/progress/progress-screen.types';
import type { HeatmapModel } from '../../screens/coach/progress/heatmap';
import type { PdfDocument, PdfSection } from './pdf-model';

type ProgressSnapshot = {
  t: (key: string, options?: Record<string, string | number>) => string;
  branding?: CoachBranding;
  clientName: string;
  range: DateRange;
  mode: AnalysisMode;
  selection: string[];
  points: Record<string, unknown>[];
  variables: VariableDef[];
  kpis: { label: string; value: string }[];
  insights: string[];
  recordInsights?: string[];
  recordsRange: DateRange;
  heatmapRange: DateRange;
  heatmap: HeatmapModel;
};

export function progressDocument(input: ProgressSnapshot): PdfDocument {
  const { t } = input;
  const sections: PdfSection[] = [
    {
      paragraphs: [
        `${t('pdf.progress.mode')}: ${t(`coach.progress.filter.mode.${input.mode}`)}`,
        `${t('pdf.progress.period')}: ${input.range.from} - ${input.range.to}`,
        `${t('pdf.progress.selection')}: ${input.selection.join(' / ')}`,
      ],
    },
  ];
  sections.push({
    heading: t('pdf.progress.indicators'),
    table: {
      columns: [t('pdf.progress.indicators'), t('pdf.progress.value')],
      rows: input.kpis.map((kpi) => [t(kpi.label), kpi.value]),
    },
  });
  for (const variable of input.variables) {
    const points = input.points.map((point) => ({
      label: String(point[input.mode === 'microcycle' ? 'weekStart' : 'sessionDate'] ?? ''),
      value: typeof point[variable.dataKey] === 'number' ? (point[variable.dataKey] as number) : null,
    }));
    sections.push({
      heading: t(variable.labelKey),
      chart: { points, unit: variable.unit, color: variable.color },
      table: {
        columns: [t('pdf.progress.date'), `${t(variable.labelKey)}${variable.unit ? ` (${variable.unit})` : ''}`],
        rows: points.map((point) => [point.label, point.value ?? '-']),
      },
    });
  }
  if (input.insights.length)
    sections.push({
      heading: t('coach.progress.insight.title'),
      paragraphs: [`${t('pdf.progress.period')}: ${input.range.from} - ${input.range.to}`, ...input.insights],
    });
  if (input.recordInsights?.length)
    sections.push({
      heading: t('pdf.progress.recordsPeriod'),
      paragraphs: [`${input.recordsRange.from} - ${input.recordsRange.to}`, ...input.recordInsights],
    });
  sections.push({
    heading: t('coach.progress.heatmap.title'),
    paragraphs: [
      `${t('pdf.progress.consistencyPeriod')}: ${input.heatmapRange.from} - ${input.heatmapRange.to}`,
      t('coach.progress.heatmap.summary', {
        best: input.heatmap.bestStreak,
        current: input.heatmap.currentStreak,
        days: input.heatmap.trainedDays,
      }),
    ],
    heatmap: input.heatmap.weeks.map((week) => week.map((cell) => ({ ...cell }))),
  });
  return {
    title: t('pdf.progress.title'),
    filename: `progress-${input.range.to}.pdf`,
    clientName: input.clientName,
    branding: input.branding ? { ...input.branding } : undefined,
    generatedAt: new Date(),
    sections,
    labels: { generated: t('pdf.generated'), draft: t('pdf.draft'), page: t('pdf.page') },
  };
}
