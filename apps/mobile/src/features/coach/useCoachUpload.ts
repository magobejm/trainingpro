import { useMutation } from '@tanstack/react-query';
import { useToast } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { useCoachAuth } from '../../data/hooks/useCoachData';
export function useCoachUpload<T = { imageUrl: string }>(
  path: string,
  types: string[] = ['image/jpeg', 'image/png'],
  maxBytes = 5 * 1024 * 1024,
) {
  const auth = useCoachAuth();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<T | null, Error, void>({
    networkMode: 'always',
    retry: false,
    mutationFn: async () => {
      if (!auth.accessToken || auth.activeRole !== 'coach') throw new Error(t('coachWorkspace.sessionRequired'));
      const picker = await import('expo-document-picker');
      const result = await picker.getDocumentAsync({ type: types, copyToCacheDirectory: true });
      if (result.canceled) return null;
      const file = result.assets[0];
      if (!file || file.size == null || file.size > maxBytes) throw new Error(t('coachWorkspace.fileTooLarge'));
      const form = new FormData();
      form.append('file', file.file ?? ({ uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob));
      const response = await fetch((process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080') + path, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + auth.accessToken, 'X-Active-Role': auth.activeRole },
        body: form,
      });
      if (!response.ok) throw new Error(t('coachWorkspace.uploadError'));
      return response.json() as Promise<T>;
    },
    onSuccess: (data) => {
      if (data) toast.success(t('coachWorkspace.saved'));
    },
    onError: (error) => toast.error(error.message),
  });
}
