export type OnboardingStep = 'client' | 'routine' | 'assignment' | 'message';
export type CoachOnboarding = { hidden: boolean; steps: Record<OnboardingStep, boolean> };
export const onboardingSteps: OnboardingStep[] = ['client', 'routine', 'assignment', 'message'];

export function onboardingClient<T extends { id: string; trainingPlanId: string | null }>(
  clients: T[],
  step: OnboardingStep,
) {
  return (step === 'assignment' ? clients.find((client) => !client.trainingPlanId) : undefined) ?? clients[0];
}

export function onboardingProgress(steps: CoachOnboarding['steps']) {
  return { completed: onboardingSteps.filter((key) => steps[key]).length, total: onboardingSteps.length };
}

export function shouldShowOnboarding(data: CoachOnboarding) {
  const progress = onboardingProgress(data.steps);
  return !data.hidden && progress.completed < progress.total;
}

export function subscribeOnboardingRefresh(client: QueryClient) {
  return client.getMutationCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    const key = event.mutation.options.mutationKey;
    if (key?.[0] === 'coach' && key[1] === 'onboarding') return;
    void client.invalidateQueries({ queryKey: ['coach', 'onboarding'] });
  });
}
import type { QueryClient } from '@tanstack/react-query';
