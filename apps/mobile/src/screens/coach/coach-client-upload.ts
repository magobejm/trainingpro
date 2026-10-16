import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@trainerpro/ui';
import { useAuthStore } from '../../store/auth.store';
import { useCoachCopy } from './coach-copy';
export function useClientAvatarUpload(clientId: string) {
  const cache = useQueryClient();
  const toast = useToast();
  const c = useCoachCopy();
  const auth = useAuthStore();
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async () => {
      const picker = await import('expo-document-picker');
      const result = await picker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (result.canceled) return false;
      const asset = result.assets[0];
      if (!asset || !asset.size || asset.size > 2_000_000) throw new Error(c('uploadError'));
      if (!auth.accessToken || auth.activeRole !== 'coach') throw new Error('Unauthorized');
      const form = new FormData();
      form.append('file', asset.file ?? ({ uri: asset.uri, name: asset.name, type: asset.mimeType } as unknown as Blob));
      const response = await fetch(
        (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080') +
          '/clients/' +
          encodeURIComponent(clientId) +
          '/avatar',
        { method: 'POST', headers: { Authorization: 'Bearer ' + auth.accessToken, 'X-Active-Role': 'coach' }, body: form },
      );
      if (!response.ok) throw new Error(c('uploadError'));
      return true;
    },
    onSuccess: (uploaded) => {
      if (uploaded) {
        toast.success(c('save'));
        void cache.invalidateQueries({ queryKey: ['coach'] });
        void cache.invalidateQueries({ queryKey: ['clients'] });
      }
    },
    onError: (error) => toast.error(error.message),
  });
}
