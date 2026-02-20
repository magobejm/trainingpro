import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CardioMethodWriteInput = {
  description?: null | string;
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

export type FoodWriteInput = {
  caloriesKcal?: null | number;
  carbsG?: null | number;
  fatG?: null | number;
  foodCategory?: null | string;
  foodType?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  name: string;
  notes?: null | string;
  proteinG?: null | number;
  servingUnit: string;
};

export function useCreateCardioMethodMutation() {
  return createWriteMutation<CardioMethodWriteInput>('cardio-methods', 'POST');
}

export function useCreateExerciseMutation() {
  return createWriteMutation<ExerciseWriteInput>('exercises', 'POST');
}

export function useCreateFoodMutation() {
  return createWriteMutation<FoodWriteInput>('foods', 'POST');
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

export function useUploadLibraryImageMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadLibraryImage(auth, file),
  });
}

function createWriteMutation<TInput>(resource: string, method: 'PATCH' | 'POST') {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => writeItem(auth, resource, method, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

async function writeItem<TInput>(
  auth: ReturnType<typeof useAuth>,
  resource: string,
  method: 'PATCH' | 'POST',
  input: TInput,
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const client = createApiClient(auth);
  if (method === 'POST') {
    await client.post(`/library/${resource}`, input);
    return;
  }
  throw new Error('PATCH endpoint requires explicit item id');
}

async function deleteItem(
  auth: ReturnType<typeof useAuth>,
  resource: string,
  itemId: string,
): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  await createApiClient(auth).delete(`/library/${resource}/${itemId}`);
}

async function updateItem<TPayload>(
  auth: ReturnType<typeof useAuth>,
  resource: string,
  itemId: string,
  payload: TPayload,
): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  await createApiClient(auth).patch(`/library/${resource}/${itemId}`, payload);
}

async function uploadLibraryImage(
  auth: ReturnType<typeof useAuth>,
  file: File,
): Promise<{ imageUrl: string }> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${resolveApiBaseUrl()}/library/media-image`, {
    body: form,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Active-Role': auth.activeRole,
    },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await mapLibraryUploadError(response));
  }
  return (await response.json()) as { imageUrl: string };
}

async function mapLibraryUploadError(response: Response): Promise<string> {
  if (response.status === 400) {
    const payload = (await safeReadText(response)).toLowerCase();
    if (payload.includes('size limit')) {
      return 'coach.library.media.errors.imageTooLarge';
    }
    if (payload.includes('image format')) {
      return 'coach.library.media.errors.invalidImageType';
    }
  }
  if (response.status === 401) {
    return 'auth.login.error';
  }
  return 'coach.library.media.errors.uploadFailed';
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function resolveApiBaseUrl(): string {
  const scope = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  const processEnv = scope.process?.env ?? {};
  const metaEnv =
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  return (
    metaEnv.EXPO_PUBLIC_API_BASE_URL ??
    processEnv.EXPO_PUBLIC_API_BASE_URL ??
    'http://localhost:8080'
  );
}
