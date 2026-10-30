import { useMutation } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type FeedbackCategory = 'EXERCISE' | 'OTHER';

export type CreateClientNoteInput = {
  category: FeedbackCategory;
  exerciseLibraryId?: null | string;
  exerciseName?: null | string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  text: string;
};

/** The note the client leaves about an exercise. The coach reads it from the web. */
export function useCreateClientNoteMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return useMutation({
    mutationFn: (input: CreateClientNoteInput) => {
      if (!accessToken || !activeRole) throw new Error('Missing authenticated context');
      return createApiClient({ accessToken, activeRole }).post<{ id: string }>('/client-notes', input);
    },
  });
}
