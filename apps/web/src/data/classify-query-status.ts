import { ApiClientError, ForbiddenApiError, UnauthorizedApiError } from './api-client';

export type QueryStatus =
  | 'empty'
  | 'forbidden'
  | 'loading'
  | 'network'
  | 'noResults'
  | 'ready'
  | 'server'
  | 'sessionExpired';

export type QueryStatusInput = {
  error?: unknown;
  hasActiveFilter?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  itemCount: number;
};

export function classifyQueryStatus(input: QueryStatusInput): QueryStatus {
  if (input.isError) {
    return classifyFailure(input.error);
  }
  if (input.isLoading) {
    return 'loading';
  }
  if (input.itemCount === 0) {
    return input.hasActiveFilter ? 'noResults' : 'empty';
  }
  return 'ready';
}

function classifyFailure(error: unknown): Exclude<QueryStatus, 'empty' | 'loading' | 'noResults' | 'ready'> {
  const status = readStatus(error);
  if (error instanceof UnauthorizedApiError || status === 401) {
    return 'sessionExpired';
  }
  if (error instanceof ForbiddenApiError || status === 403) {
    return 'forbidden';
  }
  if (isNetworkFailure(error)) {
    return 'network';
  }
  return 'server';
}

function readStatus(error: unknown): number | null {
  if (error instanceof ApiClientError) {
    return error.status;
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === 'number' ? status : null;
  }
  return null;
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 0;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  return /failed to fetch|network request failed|load failed|networkerror/i.test(error.message);
}
