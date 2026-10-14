import React from 'react';
import { Text, View } from 'react-native';
import { Button, colors, fontSize, space } from '@trainerpro/ui';
import { useBranding } from '../../data/hooks/useBranding';
import { recentRecordRange, useClientRecordsQuery } from '../../data/hooks/useClientRecordsQuery';
import { useRecentSessionsQuery } from '../../data/hooks/useRecentSessionsQuery';
import { usePerformedTemplatesQuery } from '../../data/hooks/usePerformedTemplatesQuery';
import { buildHeatmap, heatmapRange } from '../../screens/coach/progress/heatmap';
import { buildInsights, recordInsights } from '../../screens/coach/progress/build-insights';
import type { AnalysisMode, DateRange, VariableDef } from '../../screens/coach/progress/progress-screen.types';
import { PdfDownloadButton } from './PdfDownloadButton';
import { progressDocument } from './progress-document';

type Props = {
  clientId: string;
  clientName: string;
  disabled: boolean;
  mode: AnalysisMode;
  range: DateRange;
  exerciseName: string;
  templateId: string | null;
  dayIndex: number | null;
  dayName?: string;
  category: string | null;
  variables: VariableDef[];
  points: Record<string, unknown>[];
  kpis: { label: string; value: string }[];
  t: (key: string, options?: Record<string, string | number>) => string;
};

export function ProgressPdfButton(props: Props): React.JSX.Element {
  const branding = useBranding();
  const now = new Date();
  const consistencyRange = heatmapRange(now);
  const recordsRange = recentRecordRange(14);
  const sessions = useRecentSessionsQuery({ clientId: props.clientId, ...consistencyRange, limit: 200 });
  const records = useClientRecordsQuery(props.clientId, recordsRange.from, recordsRange.to);
  const templates = usePerformedTemplatesQuery(
    { clientId: props.clientId, ...props.range },
    {
      enabled: props.mode !== 'exercise' && Boolean(props.templateId),
    },
  );
  const needsTemplate = props.mode !== 'exercise' && Boolean(props.templateId);
  const required = [branding, sessions, records, ...(needsTemplate ? [templates] : [])];
  const blocked = props.disabled || required.some((query) => query.isPending || query.isError || query.isFetching);
  const failed = required.some((query) => query.isError);
  const selection =
    props.mode === 'exercise'
      ? [props.exerciseName]
      : [
          templates.data?.templates.find((template) => template.id === props.templateId)?.name,
          props.dayIndex === null ? null : props.dayName || String(props.dayIndex),
          props.category ? props.t(`coach.progress.filter.category.${props.category}`) : null,
        ].filter((value): value is string => Boolean(value));
  return (
    <View style={{ gap: space.xs, alignItems: 'flex-start' }}>
      <PdfDownloadButton
        disabled={blocked}
        label={props.t('pdf.download')}
        busyLabel={props.t('pdf.downloading')}
        errorMessage={props.t('pdf.error')}
        document={() =>
          progressDocument({
            t: props.t,
            branding: branding.data,
            clientName: props.clientName,
            mode: props.mode,
            range: { ...props.range },
            selection,
            points: props.points,
            variables: props.variables,
            kpis: props.kpis,
            insights: buildInsights(props.mode, props.points).map((insight) => insight.text),
            recordInsights: recordInsights(records.data?.records ?? [], props.t).map((insight) => insight.text),
            recordsRange,
            heatmapRange: consistencyRange,
            heatmap: buildHeatmap(sessions.data ?? [], now),
          })
        }
      />
      {failed ? (
        <>
          <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: fontSize.sm }}>
            {props.t('pdf.error')}
          </Text>
          <Button
            label={props.t('common.retry')}
            variant="ghost"
            size="sm"
            onPress={() => void Promise.allSettled(required.map((query) => query.refetch()))}
          />
        </>
      ) : null}
    </View>
  );
}
