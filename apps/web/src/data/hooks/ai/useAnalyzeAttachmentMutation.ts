import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { createApiClient } from '../../api-client';
import { useAuthStore } from '../../../store/auth.store';
import type { TechniqueAnalysisResult } from './useAnalyzeTechniqueMutation';

type Payload = { attachmentId: string; exerciseName?: string };

/** Runs the technique evaluator over a video/image already received in a chat thread. */
export function useAnalyzeAttachmentMutation(): UseMutationResult<TechniqueAnalysisResult, Error, Payload> {
  const activeRole = useAuthStore((state) => state.activeRole);
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: (payload: Payload) =>
      createApiClient({
        accessToken: accessToken ?? undefined,
        activeRole: activeRole ?? 'coach',
      }).post<TechniqueAnalysisResult>('/ai-evaluator/analyze-attachment', payload),
  });
}
