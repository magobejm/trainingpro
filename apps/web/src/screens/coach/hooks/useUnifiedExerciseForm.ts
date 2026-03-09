import { useState, useCallback, useEffect } from 'react';
import { UnifiedExerciseDto } from '../../../data/hooks/useLibraryMutations';

export type ExerciseCategory = UnifiedExerciseDto['category'];

export interface UnifiedExerciseFormState {
  name: string;
  category: ExerciseCategory;
  mediaUrl?: string;
  youtubeUrl?: string;
  instructions?: string;
  equipmentId?: string;

  // Strengh
  muscleGroupIds: string[];
  movementPatternId?: string;
  anatomicalPlaneId?: string;

  // Others
  cardioTypeId?: string;
  plioTypeId?: string;
  mobilityTypeId?: string;
  sportTypeId?: string;
}

export interface UnifiedExerciseItem {
  id: string;
  kind: string;
  name: string;
  mediaUrl?: string | null;
  youtubeUrl?: string | null;
  instructions?: string | null;
  description?: string | null;
  equipmentId?: string | null;
  equipmentRef?: { id: string };
  muscleGroups?: { muscleGroupId: string }[];
  movementPatternId?: string | null;
  movementPatternRef?: { id: string };
  anatomicalPlaneId?: string | null;
  anatomicalPlaneRef?: { id: string };
  methodTypeId?: string | null;
  methodTypeRef?: { id: string };
  plioTypeId?: string | null;
  plioTypeRef?: { id: string };
  mobilityTypeId?: string | null;
  mobilityTypeRef?: { id: string };
  mobilityTypeRefRel?: { id: string };
  sportTypeId?: string | null;
  sportTypeRef?: { id: string };
}

const DEFAULT_STATE: UnifiedExerciseFormState = {
  name: '',
  category: 'strength',
  muscleGroupIds: [],
};

const hydrateState = (
  item: UnifiedExerciseItem | null | undefined,
  defaultCategory?: ExerciseCategory,
): UnifiedExerciseFormState => {
  if (!item) {
    return {
      ...DEFAULT_STATE,
      category: defaultCategory || 'strength',
    };
  }

  return {
    name: item.name || '',
    category: ((item.kind === 'exercise' ? 'strength' : item.kind) as ExerciseCategory) || 'strength',
    mediaUrl: item.mediaUrl || undefined,
    youtubeUrl: item.youtubeUrl || undefined,
    instructions: item.description || item.instructions || undefined,
    equipmentId: item.equipmentId || item.equipmentRef?.id,

    // Biomechanical & specific types
    muscleGroupIds: item.muscleGroups?.map((mg) => mg.muscleGroupId) || [],
    movementPatternId: item.movementPatternId || item.movementPatternRef?.id,
    anatomicalPlaneId: item.anatomicalPlaneId || item.anatomicalPlaneRef?.id,
    cardioTypeId: item.methodTypeId || item.methodTypeRef?.id,
    plioTypeId: item.plioTypeId || item.plioTypeRef?.id,
    mobilityTypeId: item.mobilityTypeId || item.mobilityTypeRef?.id || item.mobilityTypeRefRel?.id,
    sportTypeId: item.sportTypeId || item.sportTypeRef?.id,
  };
};

export const useUnifiedExerciseForm = (initialItem?: UnifiedExerciseItem | null, defaultCategory?: ExerciseCategory) => {
  const [state, setState] = useState<UnifiedExerciseFormState>(() => hydrateState(initialItem, defaultCategory));

  useEffect(() => {
    setState(hydrateState(initialItem, defaultCategory));
  }, [initialItem, defaultCategory]);

  const handleChange = useCallback(
    <K extends keyof UnifiedExerciseFormState>(key: K, value: UnifiedExerciseFormState[K]) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'category' && value !== 'strength') {
          next.muscleGroupIds = [];
          next.movementPatternId = undefined;
          next.anatomicalPlaneId = undefined;
        }
        return next;
      });
    },
    [],
  );

  const toggleMuscleGroup = useCallback((id: string, allOptions?: { label: string; value: string }[]) => {
    setState((prev) => ({
      ...prev,
      muscleGroupIds: resolveMuscleGroupIds(prev.muscleGroupIds, id, allOptions),
    }));
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  return { formState: state, handleChange, toggleMuscleGroup, reset };
};

function resolveMuscleGroupIds(currentIds: string[], id: string, allOptions?: { label: string; value: string }[]): string[] {
  const exists = currentIds.includes(id);
  const sinDefinirId = allOptions?.find((o) => o.label.toLowerCase().includes('sin definir'))?.value;

  let nextIds = exists ? currentIds.filter((m) => m !== id) : [...currentIds, id];

  if (!exists && id === sinDefinirId) {
    nextIds = [id];
  } else if (!exists && id !== sinDefinirId && sinDefinirId) {
    nextIds = nextIds.filter((m) => m !== sinDefinirId);
  }
  return nextIds;
}
