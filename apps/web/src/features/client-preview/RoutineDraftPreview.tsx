import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUnifiedExercisesQuery } from '../../data/hooks/useUnifiedLibraryQuery';
import { useWarmupTemplatesQuery } from '../../data/hooks/useWarmupTemplates';
import type { DraftState } from '../../screens/coach/RoutinePlanner.types';
import { resolvePreviewWarmups, unavailablePreviewWarmups } from './routine-preview-warmups';
import { RoutineClientPreview } from './ClientPreview';
import { buildRoutinePreview } from './routine-preview';
import { LoadingState } from '../../components/AsyncStatus';

export function RoutineDraftPreview({ draft }: { draft: DraftState }): React.JSX.Element {
  const { t } = useTranslation();
  const library = useUnifiedExercisesQuery({});
  const warmups = useWarmupTemplatesQuery();
  const queries = [library, warmups];
  if (queries.some((query) => query.isLoading)) return <LoadingState label={t('common.loading')} />;
  if (queries.some((query) => query.isError)) return <Text>{t('common.error')}</Text>;
  const resolvedDraft = resolvePreviewWarmups(draft, warmups.data ?? []);
  const routine = buildRoutinePreview(resolvedDraft, {
    strength: library.data,
    cardio: library.data,
    plio: library.data,
    mobility: library.data,
    isometric: library.data,
    sport: library.data,
  });
  const missing = unavailablePreviewWarmups(draft, warmups.data ?? []);
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
