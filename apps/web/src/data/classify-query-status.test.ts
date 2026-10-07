import { describe, expect, it } from 'vitest';
import { ApiClientError, ForbiddenApiError, UnauthorizedApiError } from './api-client';
import { classifyQueryStatus } from './classify-query-status';

describe('classifyQueryStatus', () => {
  it('marks an expired session and a forbidden response apart from other failures', () => {
    expect(classifyQueryStatus({ error: new UnauthorizedApiError('Unauthorized', 401), isError: true, itemCount: 0 })).toBe(
      'sessionExpired',
    );
    expect(classifyQueryStatus({ error: new ForbiddenApiError('Forbidden', 403), isError: true, itemCount: 0 })).toBe(
      'forbidden',
    );
    expect(classifyQueryStatus({ error: new ApiClientError('down', 500), isError: true, itemCount: 0 })).toBe('server');
  });

  it('treats a failed fetch as a network error', () => {
    expect(classifyQueryStatus({ error: new TypeError('Failed to fetch'), isError: true, itemCount: 0 })).toBe('network');
  });

  it('separates an empty catalog from a search without matches', () => {
    expect(classifyQueryStatus({ itemCount: 0 })).toBe('empty');
    expect(classifyQueryStatus({ hasActiveFilter: true, itemCount: 0 })).toBe('noResults');
  });

  it('keeps loading ahead of an empty list and ready when there are items', () => {
    expect(classifyQueryStatus({ isLoading: true, itemCount: 0 })).toBe('loading');
    expect(classifyQueryStatus({ itemCount: 3 })).toBe('ready');
  });
});
