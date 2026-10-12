import { describe, expect, it } from 'vitest';
import { ApiClientError } from '../../data/api-client';
import { LOADING_MESSAGE_KEYS, resolveFailureKind } from './technique-evaluator.logic';

describe('resolveFailureKind', () => {
  it('offers a retry for network failures', () => {
    expect(resolveFailureKind(new TypeError('Failed to fetch'))).toBe('network');
  });

  it('maps unexpected failures to a server error so they can be retried', () => {
    expect(resolveFailureKind(new Error('Gemini unavailable'))).toBe('server');
    expect(resolveFailureKind(undefined)).toBe('server');
  });

  it('keeps session and permission failures distinct', () => {
    expect(resolveFailureKind({ status: 401 })).toBe('sessionExpired');
    expect(resolveFailureKind({ status: 403 })).toBe('forbidden');
  });

  it('treats an API 500 as a server error', () => {
    expect(resolveFailureKind(new ApiClientError('boom', 500))).toBe('server');
  });
});

describe('LOADING_MESSAGE_KEYS', () => {
  it('lists the six loader messages', () => {
    expect(LOADING_MESSAGE_KEYS).toHaveLength(6);
    expect(new Set(LOADING_MESSAGE_KEYS).size).toBe(6);
  });
});
