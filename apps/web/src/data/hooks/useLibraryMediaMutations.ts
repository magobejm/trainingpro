import { useMutation } from '@tanstack/react-query';
import { uploadLibraryImage, useAuth } from './library-mutations.helpers';

export function useUploadLibraryImageMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadLibraryImage(auth, file),
  });
}
