import { useEffect, useRef } from 'react';
import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@trainerpro/ui';
import { ApiClientError } from '../api-client';

function feedbackErrorKey(error: unknown): string {
  return error instanceof ApiClientError && error.status === 409 && error.responseText.includes('ROUTINE_HANDOFF_CHANGED')
    ? 'coach.routine.handoff.changed'
    : 'common.mutationError';
}

/** Conserva las invalidaciones y callbacks del dominio y comunica el resultado. */
export function useFeedbackMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    ...options,
    onSuccess: (...args) => {
      toast.success(t('common.mutationSuccess'));
      return options.onSuccess?.(...args);
    },
    onError: (...args) => {
      toast.error(t(feedbackErrorKey(args[0])));
      return options.onError?.(...args);
    },
  });
}

/** Para mutaciones reutilizadas por otras pantallas que ya tienen sus propios mensajes. */
export function useMutationFeedback(result: {
  isSuccess: boolean;
  isError: boolean;
  submittedAt: number;
  error?: unknown;
}): void {
  const toast = useToast();
  const { t } = useTranslation();
  const reported = useRef(0);
  useEffect(() => {
    if (!result.submittedAt || reported.current === result.submittedAt || (!result.isSuccess && !result.isError)) return;
    reported.current = result.submittedAt;
    if (result.isError) toast.error(t(feedbackErrorKey(result.error)));
    else toast.success(t('common.mutationSuccess'));
  }, [result.isSuccess, result.isError, result.submittedAt, result.error, t, toast]);
}
