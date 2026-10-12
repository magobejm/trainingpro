import { useEffect, useRef } from 'react';
import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@trainerpro/ui';

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
      toast.error(t('common.mutationError'));
      return options.onError?.(...args);
    },
  });
}

/** Para mutaciones reutilizadas por otras pantallas que ya tienen sus propios mensajes. */
export function useMutationFeedback(result: { isSuccess: boolean; isError: boolean; submittedAt: number }): void {
  const toast = useToast();
  const { t } = useTranslation();
  const reported = useRef(0);
  useEffect(() => {
    if (!result.submittedAt || reported.current === result.submittedAt || (!result.isSuccess && !result.isError)) return;
    reported.current = result.submittedAt;
    if (result.isError) toast.error(t('common.mutationError'));
    else toast.success(t('common.mutationSuccess'));
  }, [result.isSuccess, result.isError, result.submittedAt, t, toast]);
}
