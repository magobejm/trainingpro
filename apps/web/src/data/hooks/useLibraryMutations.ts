import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteItem, updateItem, useAuth, writeItem } from './library-mutations.helpers';

export type CardioMethodWriteInput = {
  description?: null | string;
  equipment?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  methodTypeId: string;
  name: string;
  youtubeUrl?: null | string;
};

export type ExerciseWriteInput = {
  equipment?: null | string;
  instructions?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  muscleGroupId: string;
  name: string;
  youtubeUrl?: null | string;
};

export function useCreateCardioMethodMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CardioMethodWriteInput) => writeItem(auth, 'cardio-methods', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useCreateExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExerciseWriteInput) => writeItem(auth, 'exercises', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeleteCardioMethodMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'cardio-methods', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeleteExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'exercises', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateCardioMethodMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: CardioMethodWriteInput }) =>
      updateItem(auth, 'cardio-methods', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: ExerciseWriteInput }) =>
      updateItem(auth, 'exercises', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
