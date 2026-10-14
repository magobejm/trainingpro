import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBranding } from '../../data/hooks/useBranding';
import { useWarmupTemplatesQuery } from '../../data/hooks/useWarmupTemplates';
import type { DraftState } from '../../screens/coach/RoutinePlanner.types';
import type { NutritionMeal } from '../../screens/coach/nutrition/nutrition.types';
import { PdfDownloadButton } from './PdfDownloadButton';
import { routinePdfSections, nutritionPdfSections } from './plan-document';
import type { NutritionDocumentPlan } from './nutrition-document';
import type { PdfDocument, PdfSection } from './pdf-model';

type CommonProps = { isDraft: boolean; clientName?: string; disabled?: boolean };

export function RoutinePdfButton(props: CommonProps & { draft: DraftState }): React.JSX.Element {
  const warmups = useWarmupTemplatesQuery();
  const { t } = useTranslation();
  const needsWarmups = props.draft.days.some((day) => Boolean(day.warmupTemplates?.length));
  return (
    <PlanPdfButton
      {...props}
      title={props.draft.name || t('web.pdf.routine')}
      disabled={props.disabled || (needsWarmups && (warmups.isPending || warmups.isError || warmups.isFetching))}
      sections={() => routinePdfSections(props.draft, warmups.data ?? [], t)}
    />
  );
}

export function NutritionPdfButton(
  props: CommonProps & {
    plan: NutritionDocumentPlan;
    meals: NutritionMeal[];
  },
): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <PlanPdfButton
      {...props}
      title={props.plan.name || t('web.pdf.nutrition')}
      sections={() => nutritionPdfSections(props.plan, props.meals, t)}
    />
  );
}

function PlanPdfButton(props: CommonProps & { title: string; sections: () => PdfSection[] }): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const branding = useBranding();
  const document = async (): Promise<PdfDocument> => {
    const snapshot = structuredClone(props.sections());
    const fresh = await branding.refetch();
    if (fresh.isError || !fresh.data) throw new Error(t('pdf.error'));
    return {
      title: props.title,
      filename: `${safeFilename(props.title)}.pdf`,
      clientName: props.clientName,
      draft: props.isDraft,
      sections: snapshot,
      branding: fresh.data,
      locale: i18n.language,
      labels: { generated: t('pdf.generated'), draft: t('pdf.draft'), page: t('pdf.page') },
    };
  };
  return (
    <PdfDownloadButton
      document={document}
      disabled={props.disabled || branding.isPending}
      label={t('pdf.download')}
      busyLabel={t('pdf.downloading')}
      errorMessage={t('pdf.error')}
    />
  );
}

function safeFilename(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .slice(0, 80) || 'plan'
  );
}
