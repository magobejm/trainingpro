import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

export async function writeItem<TInput>(
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

export async function deleteItem(
  auth: ReturnType<typeof useAuth>,
  resource: string,
  itemId: string,
): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  await createApiClient(auth).delete(`/library/${resource}/${itemId}`);
}

export async function updateItem<TPayload>(
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

export async function uploadLibraryImage(
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
