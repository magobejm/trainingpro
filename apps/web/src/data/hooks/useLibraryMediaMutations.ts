import { useMutation } from '@tanstack/react-query';
import { uploadLibraryImage } from './library-mutations.helpers';
import { useAuth } from './use-api-auth';

export function useUploadLibraryImageMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadLibraryImage(auth, file),
  });
}
