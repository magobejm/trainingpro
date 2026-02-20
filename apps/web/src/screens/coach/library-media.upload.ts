import { type UseMutationResult } from '@tanstack/react-query';
import { pickLibraryImageFile, validateLibraryImageFile } from './library-media.helpers';

type UploadMutation = UseMutationResult<{ imageUrl: string }, Error, File, unknown>;

export async function uploadLibraryMediaImage(
  uploadMutation: UploadMutation,
  setImageUrl: (value: string) => void,
  setError: (value: string) => void,
): Promise<void> {
  const file = await pickLibraryImageFile();
  if (!file) {
    return;
  }
  const errorKey = validateLibraryImageFile(file);
  if (errorKey) {
    setError(errorKey);
    return;
  }
  setError('');
  try {
    const result = await uploadMutation.mutateAsync(file);
    setImageUrl(result.imageUrl);
  } catch (error) {
    if (error instanceof Error && error.message) {
      setError(error.message);
      return;
    }
    setError('coach.library.media.errors.uploadFailed');
  }
}
