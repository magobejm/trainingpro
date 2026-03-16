import { useMemo } from 'react';
import { SelectOption } from '../UnifiedExerciseModal.types';
import { readYouTubeVideoId } from '../library-media.helpers';
import { UnifiedExerciseFormState } from './useUnifiedExerciseForm';

export function useExerciseModalData({
  catalogs,
  formState,
  t,
  setVideoPlaying,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalogs: any;
  formState: UnifiedExerciseFormState;
  t: (key: string) => string;
  setVideoPlaying: (v: boolean) => void;
}) {
  const categories: SelectOption[] = useMemo(
    () => [
      { label: t('coach.library.categories.strength'), value: 'strength' },
      { label: t('coach.library.categories.cardio'), value: 'cardio' },
      { label: t('coach.library.categories.plio'), value: 'plio' },
      { label: t('coach.library.categories.warmup'), value: 'warmup' },
      { label: t('coach.library.categories.isometricTypes'), value: 'isometric' },
      { label: t('coach.library.categories.sport'), value: 'sport' },
    ],
    [t],
  );

  const mappedCatalogs = useMemo(() => {
    if (!catalogs) return {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toOpts = (arr: any[]): SelectOption[] => arr.map((a) => ({ label: a.label, value: a.id }));
    return {
      muscles: toOpts(catalogs.muscleGroups || []),
      cardioTypes: toOpts(catalogs.cardioMethodTypes || []),
      plioTypes: toOpts(catalogs.plioTypes || []),
      mobilityTypes: toOpts(catalogs.mobilityTypes || []),
      isometricTypes: toOpts(catalogs.isometricTypes || []),
      sportTypes: toOpts(catalogs.sportTypes || []),
      equipment: toOpts(catalogs.equipmentTypes || []),
      movementPatterns: toOpts(catalogs.movementPatterns || []),
      anatomicalPlanes: toOpts(catalogs.anatomicalPlanes || []),
    };
  }, [catalogs]);

  const youtubeId = useMemo(() => {
    if (!formState.youtubeUrl) return null;
    setVideoPlaying(false);
    return readYouTubeVideoId(formState.youtubeUrl);
  }, [formState.youtubeUrl, setVideoPlaying]);

  return { categories, mappedCatalogs, youtubeId };
}
