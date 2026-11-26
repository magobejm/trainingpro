import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';

type ProfileIdentityPatch = {
  allergies?: string | null;
  considerations?: string | null;
  firstName?: string;
  injuries?: string | null;
  lastName?: string;
  phone?: string | null;
};

type AvatarShot = { file?: Blob; name: string; type: string; uri: string };

export function useUpdateOwnProfileMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileIdentityPatch) => saveProfile(accessToken, body),
    onSuccess: () => invalidateMe(queryClient),
  });
}

export function useUploadOwnAvatarMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shot: AvatarShot) => uploadAvatar(accessToken, shot),
    onSuccess: () => invalidateMe(queryClient),
  });
}

function saveProfile(accessToken: string | null, body: ProfileIdentityPatch) {
  if (!accessToken) throw new Error('Missing session');
  return createApiClient({ accessToken, activeRole: 'client' }).patch('/clients/me', body);
}

async function uploadAvatar(accessToken: string | null, shot: AvatarShot): Promise<void> {
  if (!accessToken) throw new Error('Missing session');
  const form = new FormData();
  form.append('file', shot.file ?? ({ name: shot.name, type: shot.type, uri: shot.uri } as unknown as Blob));
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const response = await fetch(`${base}/clients/me/avatar`, {
    body: form,
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Active-Role': 'client' },
    method: 'POST',
  });
  if (!response.ok) throw new Error('Upload failed');
}

function invalidateMe(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['clients', 'me'] });
}
