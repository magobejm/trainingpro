import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuth } from './library-mutations.helpers';

export type CopyTarget = {
  /** Only for exercises: strength, cardio, plio, warmup, isometric or sport. */
  category?: string;
  id: string;
  kind: 'exercise' | 'food' | 'meal' | 'plan' | 'routine' | 'warmup';
  name: string;
};

const EXERCISE_CATEGORY_BY_KIND: Record<string, string> = {
  cardio: 'cardio',
  exercise: 'strength',
  isometric: 'isometric',
  plio: 'plio',
  sport: 'sport',
  warmup: 'warmup',
};

/** Maps the unified library `kind` of a card to the category the copy endpoint expects. */
export function exerciseCopyTarget(item: { id: string; kind: string; name: string }): CopyTarget {
  return { category: EXERCISE_CATEGORY_BY_KIND[item.kind] ?? item.kind, id: item.id, kind: 'exercise', name: item.name };
}

export function copyPath(target: CopyTarget): string {
  switch (target.kind) {
    case 'exercise':
      return `/library/exercises/unified/${target.category}/${target.id}/copy`;
    case 'food':
      return `/library/foods/${target.id}/copy`;
    case 'routine':
      return `/plans/templates/routines/${target.id}/copy`;
    case 'warmup':
      return `/plans/templates/warmups/${target.id}/copy`;
    case 'meal':
      return `/nutrition/meals/${target.id}/copy`;
    case 'plan':
      return `/nutrition/plans/${target.id}/copy`;
  }
}

export function useCopyLibraryItemMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; target: CopyTarget }) =>
      createApiClient(auth!).post<unknown>(copyPath(input.target), { name: input.name }),
    onSuccess: () => {
      for (const key of ['library', 'routine-templates', 'warmup-templates', 'nutrition']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
