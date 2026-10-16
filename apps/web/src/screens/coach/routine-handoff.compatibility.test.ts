import { afterEach, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../store/auth.store';
import { loadRoutineHandoffPreview } from './useRoutineHandoffReview';

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clearSession();
});

it('never sends dryRun to an API that has not declared support', async () => {
  useAuthStore.setState({ accessToken: 'test-token', activeRole: 'coach' });
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  await expect(loadRoutineHandoffPreview('11111111-1111-4111-8111-111111111111', '2026-10-16')).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0]?.[0]).toContain('/health');
});

it('requests a read-only simulation after checking capability support', async () => {
  useAuthStore.setState({ accessToken: 'test-token', activeRole: 'coach' });
  const preview = {
    clientId: '11111111-1111-4111-8111-111111111111',
    from: '2026-10-16',
    currentRoutineId: null,
    removable: [],
    preserved: [],
    signature: 'a'.repeat(64),
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok', capabilities: { routineHandoffPreview: true } })))
    .mockResolvedValueOnce(new Response(JSON.stringify(preview)));
  vi.stubGlobal('fetch', fetch);
  expect(await loadRoutineHandoffPreview(preview.clientId, preview.from)).toEqual(preview);
  expect(fetch).toHaveBeenCalledTimes(2);
  const request = fetch.mock.calls[1]?.[1] as RequestInit;
  expect(request.method).toBe('POST');
  expect(JSON.parse(request.body as string)).toEqual({ clientId: preview.clientId, from: preview.from, dryRun: true });
});
