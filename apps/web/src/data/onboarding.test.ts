import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { onboardingClient, onboardingProgress, shouldShowOnboarding, subscribeOnboardingRefresh } from './onboarding';

describe('onboarding presentation', () => {
  const steps = { client: true, routine: true, assignment: false, message: false };
  it('counts real steps and hides dismissed or completed guides', () => {
    expect(onboardingProgress(steps)).toEqual({ completed: 2, total: 4 });
    expect(shouldShowOnboarding({ hidden: false, steps })).toBe(true);
    expect(shouldShowOnboarding({ hidden: true, steps })).toBe(false);
    expect(shouldShowOnboarding({ hidden: false, steps: { ...steps, assignment: true, message: true } })).toBe(false);
  });
  it('suggests an unassigned client for assignment and handles an empty directory', () => {
    const clients = [
      { id: 'assigned', trainingPlanId: 'routine-1' },
      { id: 'new', trainingPlanId: null },
    ];
    expect(onboardingClient(clients, 'assignment')?.id).toBe('new');
    expect(onboardingClient(clients, 'message')?.id).toBe('assigned');
    expect(onboardingClient([], 'assignment')).toBeUndefined();
  });
  it('refreshes after successful app writes, excludes preference writes, and unsubscribes', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const stop = subscribeOnboardingRefresh(client);
    const execute = (mutationKey: string[]) =>
      client
        .getMutationCache()
        .build(client, { mutationKey, mutationFn: async () => ({ ok: true }) })
        .execute(undefined);
    await execute(['clients', 'create']);
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ['coach', 'onboarding'] });
    await execute(['coach', 'onboarding', 'save']);
    expect(invalidate).toHaveBeenCalledTimes(1);
    stop();
    await execute(['chat', 'send']);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
