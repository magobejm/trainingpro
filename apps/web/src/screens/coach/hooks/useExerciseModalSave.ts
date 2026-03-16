import { useState } from 'react';
import { UnifiedExerciseFormState } from '../hooks/useUnifiedExerciseForm';
import { UnifiedExerciseItem } from '../hooks/useUnifiedExerciseForm';
import { useCreateUnifiedExerciseMutation, useUpdateUnifiedExerciseMutation } from '../../../data/hooks/useLibraryMutations';
import { useUploadLibraryImageMutation } from '../../../data/hooks/useLibraryMediaMutations';

interface Props {
  formState: UnifiedExerciseFormState;
  selectedFile: File | null;
  itemToEdit: UnifiedExerciseItem | null | undefined;
  onSuccess: () => void;
}

export function useExerciseModalSave({ formState, selectedFile, itemToEdit, onSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateUnifiedExerciseMutation();
  const updateMutation = useUpdateUnifiedExerciseMutation();
  const uploadMutation = useUploadLibraryImageMutation();

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;

  const handleSave = async () => {
    if (!formState.name.trim()) return;
    let finalMediaUrl = formState.mediaUrl;
    if (selectedFile) {
      setIsUploading(true);
      setErrorMessage(null);
      try {
        const { imageUrl } = await uploadMutation.mutateAsync(selectedFile);
        finalMediaUrl = imageUrl;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        setErrorMessage(message || 'coach.library.media.errors.uploadFailed');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    const payload = { ...formState, mediaUrl: finalMediaUrl };
    console.log('[useExerciseModalSave] Saving payload:', JSON.stringify(payload, null, 2));
    const opts = { onSuccess };
    if (itemToEdit) {
      updateMutation.mutate(
        {
          itemId: (itemToEdit as UnifiedExerciseItem & { id: string }).id,
          payload,
        },
        opts,
      );
    } else {
      createMutation.mutate(payload, opts);
    }
  };

  return { handleSave, isPending, errorMessage, setErrorMessage };
}
