import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteItem, updateItem, useAuth, writeItem } from './library-mutations.helpers';

export type IsometricExerciseWriteInput = {
  description?: string | null;
  equipment?: string | null;
  isometricType?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  name: string;
  notes?: string | null;
  youtubeUrl?: string | null;
};

export type PlioExerciseWriteInput = {
  description?: string | null;
  equipment?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  name: string;
  plioType?: string | null;
  notes?: string | null;
  youtubeUrl?: string | null;
};

export type MobilityExerciseWriteInput = {
  description?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mobilityType?: string | null;
  name: string;
  youtubeUrl?: string | null;
};

export type SportWriteInput = {
  description?: string | null;
  icon: string;
  mediaUrl?: string | null;
  name: string;
};

export function useCreateIsometricExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IsometricExerciseWriteInput) => writeItem(auth, 'isometrics', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeleteIsometricExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'isometrics', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateIsometricExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: Partial<IsometricExerciseWriteInput> }) =>
      updateItem(auth, 'isometrics', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useCreatePlioExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlioExerciseWriteInput) => writeItem(auth, 'plyometrics', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useCreateMobilityExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MobilityExerciseWriteInput) => writeItem(auth, 'mobility', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useCreateSportMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SportWriteInput) => writeItem(auth, 'sports', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeletePlioExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'plyometrics', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeleteMobilityExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'mobility', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeleteSportMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'sports', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdatePlioExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: Partial<PlioExerciseWriteInput> }) =>
      updateItem(auth, 'plyometrics', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateMobilityExerciseMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: Partial<MobilityExerciseWriteInput> }) =>
      updateItem(auth, 'mobility', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateSportMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: Partial<SportWriteInput> }) =>
      updateItem(auth, 'sports', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
