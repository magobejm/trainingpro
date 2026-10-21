import React from 'react';
import { useTranslation } from 'react-i18next';
import { PdfDownloadButton } from '../../../features/pdf/PdfDownloadButton';
import { useBranding } from '../../../data/hooks/useBranding';
import type { PdfSection } from '../../../features/pdf/pdf-model';
import type { DashboardMetric } from './DashboardChart';
import { formatMetric, type DashboardPoint } from './dashboard-model';

export function DashboardPdf(props: {
  clientName: string;
  title: string;
  context: string[];
  metrics: DashboardMetric[];
  points: DashboardPoint[];
}): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const branding = useBranding();
  return (
    <PdfDownloadButton
      label={t('pdf.download')}
      busyLabel={t('pdf.downloading')}
      errorMessage={t('pdf.error')}
      disabled={!props.points.length || branding.isLoading || branding.isError}
      document={() => ({
        title: `${t('progressDashboard.title')} · ${props.title}`,
        clientName: props.clientName,
        filename: `progress-${props.points.at(-1)?.date ?? 'report'}.pdf`,
        locale: i18n.language,
        branding: branding.data,
        generatedAt: new Date(),
        labels: { generated: t('pdf.generated'), draft: t('pdf.draft'), page: t('pdf.page') },
        sections: [
          { paragraphs: props.context },
          ...props.metrics.flatMap((metric): PdfSection[] => [
            {
              heading: t(`progressDashboard.${metric.key}`),
              chart: {
                unit: metric.unit,
                color: metric.color,
                points: props.points.map((p) => ({
                  label: String(p.label || p.date),
                  value: typeof p[metric.key] === 'number' ? Number(p[metric.key]) / (metric.divisor ?? 1) : null,
                })),
              },
            },
            {
              table: {
                columns: [t('progressDashboard.period'), t(`progressDashboard.${metric.key}`)],
                rows: props.points.map((p) => [
                  String(p.label || p.date),
                  formatMetric(
                    typeof p[metric.key] === 'number' ? Number(p[metric.key]) / (metric.divisor ?? 1) : null,
                    metric.unit,
                  ),
                ]),
              },
            },
          ]),
        ],
      })}
    />
  );
}
