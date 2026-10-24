import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient, UnauthorizedApiError } from '../../data/api-client';
import { handleUnauthorized } from '../../data/auth-service';
import type { MeasurementKey, ProgressPose } from './client-measures.helpers';

export type ClientMeasurement = {
  createdAt: string;
  heightCm: number | null;
  hipCm: number | null;
  id: string;
  recordedBy: 'client' | 'coach';
  waistCm: number | null;
  weightKg: number | null;
};

export type ProgressShot = { file?: Blob; name: string; type: string; uri: string };

export function useClientMeasurementsQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => loadMeasurements(accessToken ?? ''),
    queryKey: ['clients', 'me', 'measurements', accessToken],
  });
}

export function useRecordMeasurementMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Record<MeasurementKey, number>>) => saveMeasurement(accessToken, body),
    onSuccess: () => invalidateClient(queryClient),
  });
}

export function useUploadProgressPhotoMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { pose: ProgressPose; shot: ProgressShot }) => uploadPhoto(accessToken, input.pose, input.shot),
    onSuccess: () => invalidateClient(queryClient),
  });
}

async function loadMeasurements(accessToken: string): Promise<ClientMeasurement[]> {
  try {
    const response = await createApiClient({ accessToken, activeRole: 'client' }).get<{ items: ClientMeasurement[] }>(
      '/clients/me/measurements',
    );
    return response.items;
  } catch (error) {
    if (error instanceof UnauthorizedApiError) void handleUnauthorized();
    throw error;
  }
}

function saveMeasurement(accessToken: string | null, body: Partial<Record<MeasurementKey, number>>) {
  if (!accessToken) throw new Error('Missing session');
  return createApiClient({ accessToken, activeRole: 'client' }).post('/clients/me/measurements', body);
}

async function uploadPhoto(accessToken: string | null, pose: ProgressPose, shot: ProgressShot): Promise<void> {
  if (!accessToken) throw new Error('Missing session');
  const form = new FormData();
  form.append('pose', pose);
  form.append('file', shot.file ?? ({ name: shot.name, type: shot.type, uri: shot.uri } as unknown as Blob));
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const response = await fetch(`${base}/clients/me/progress-photos/upload`, {
    body: form,
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Active-Role': 'client' },
    method: 'POST',
  });
  if (!response.ok) throw new Error('Upload failed');
}

function invalidateClient(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['clients', 'me'] });
}
