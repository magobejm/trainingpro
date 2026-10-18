import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUnifiedExercisesQuery } from '../../data/hooks/useUnifiedLibraryQuery';
import { useWarmupTemplatesByIds, useWarmupTemplatesQuery } from '../../data/hooks/useWarmupTemplates';
import type { DraftState } from '../../screens/coach/RoutinePlanner.types';
import { buildRoutineClientPreview, unavailablePreviewWarmups } from './routine-preview-warmups';
import { RoutineClientPreview } from './ClientPreview';
import { LoadingState } from '../../components/AsyncStatus';

export function RoutineDraftPreview({ draft }: { draft: DraftState }): React.JSX.Element {
  const { t } = useTranslation();
  const library = useUnifiedExercisesQuery({});
  const warmups = useWarmupTemplatesQuery();
  const referencedIds = draft.days.flatMap((day) => (day.warmupTemplates ?? []).map((item) => item.id));
  const referencedWarmups = useWarmupTemplatesByIds(referencedIds);
  const availableWarmups = [
    ...(warmups.data ?? []),
    ...referencedWarmups.flatMap((query) => (query.data ? [query.data] : [])),
  ].filter((template, index, all) => all.findIndex((item) => item.id === template.id) === index);
  const queries = [library, warmups, ...referencedWarmups];
  if (queries.some((query) => query.isLoading)) return <LoadingState label={t('common.loading')} />;
  if (queries.some((query) => query.isError)) return <Text>{t('common.error')}</Text>;
  const libraryData = {
    strength: library.data,
    cardio: library.data,
    plio: library.data,
    mobility: library.data,
    isometric: library.data,
    sport: library.data,
  };
  const routine = buildRoutineClientPreview(draft, availableWarmups, libraryData);
  const missing = unavailablePreviewWarmups(draft, availableWarmups);
  return (
    <>
      {missing.map((name) => (
        <Text accessibilityRole="alert" key={name}>
          {t('coach.clientPreview.missingWarmup', { name })}
        </Text>
      ))}
      <RoutineClientPreview routine={routine} />
    </>
  );
}
