import { classifyQueryStatus, type QueryStatus } from '../../data/classify-query-status';

export const LOADING_MESSAGE_KEYS = [1, 2, 3, 4, 5, 6].map((n) => `app.evaluator.loading.${n}`);

export type EvaluatorFailureKind = Exclude<QueryStatus, 'empty' | 'loading' | 'noResults' | 'ready'>;

export function resolveFailureKind(error: unknown): EvaluatorFailureKind {
  const kind = classifyQueryStatus({ error, isError: true, itemCount: 1 });
  return kind === 'forbidden' || kind === 'network' || kind === 'sessionExpired' ? kind : 'server';
}
