import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeLeaveApproval, registerUnsavedGuard } from '../layout/unsaved-leave';
import { useQuickCreateStore } from '../store/quickCreate.store';
import { useRoutinePlannerContextStore } from '../store/routinePlannerContext.store';
import { useOnboardingNavigation } from './useOnboardingNavigation';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), write: vi.fn(), pathname: '/coach/planner/routine' }));
vi.mock('react-router', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: mocks.pathname }),
}));
vi.mock('../data/hooks/useClientsQuery', () => ({
  useClientsQuery: () => ({ data: [{ id: 'client-1', firstName: 'Ana', lastName: 'Uno', trainingPlanId: null }] }),
}));
vi.mock('../layout/list-context', () => ({
  LIST_KEYS: { chat: 'chat' },
  readListContext: () => null,
  writeListContext: mocks.write,
}));

describe('onboarding navigation preserves unsaved work', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoutinePlannerContextStore.getState().openForEdit('unsaved-template');
    useQuickCreateStore.getState().consume();
    consumeLeaveApproval();
    mocks.pathname = '/coach/planner/routine';
  });
  afterEach(() => {
    registerUnsavedGuard(null);
    consumeLeaveApproval();
  });

  it.each(['client', 'routine', 'assignment', 'message'] as const)(
    'does not close the guide, mutate context, or navigate when %s is cancelled',
    (step) => {
      const close = vi.fn();
      const confirmLeave = vi.fn();
      registerUnsavedGuard({ isDirty: () => true, confirmLeave });
      useOnboardingNavigation(close)(step);
      expect(confirmLeave).toHaveBeenCalledOnce();
      expect(close).not.toHaveBeenCalled();
      expect(mocks.navigate).not.toHaveBeenCalled();
      expect(mocks.write).not.toHaveBeenCalled();
      expect(useQuickCreateStore.getState().intent).toBeNull();
      expect(useRoutinePlannerContextStore.getState().initialTemplateId).toBe('unsaved-template');
      expect(consumeLeaveApproval()).toBe(false);
    },
  );

  it.each(['client', 'routine', 'assignment', 'message'] as const)(
    'executes all actions exactly once after %s is confirmed',
    (step) => {
      let proceed = () => {};
      const close = vi.fn();
      const request = vi.spyOn(useQuickCreateStore.getState(), 'request');
      const blank = vi.spyOn(useRoutinePlannerContextStore.getState(), 'openBlankFromLibrary');
      const assignment = vi.spyOn(useRoutinePlannerContextStore.getState(), 'prepareClientAssignment');
      registerUnsavedGuard({
        isDirty: () => true,
        confirmLeave: (next) => {
          proceed = next;
        },
      });
      useOnboardingNavigation(close)(step);
      expect(mocks.navigate).not.toHaveBeenCalled();
      proceed();
      expect(close).toHaveBeenCalledOnce();
      expect(mocks.navigate).toHaveBeenCalledOnce();
      expect(request).toHaveBeenCalledTimes(step === 'client' ? 1 : 0);
      expect(blank).toHaveBeenCalledTimes(step === 'routine' ? 1 : 0);
      expect(assignment).toHaveBeenCalledTimes(step === 'assignment' ? 1 : 0);
      expect(mocks.write).toHaveBeenCalledTimes(step === 'message' ? 1 : 0);
      expect(consumeLeaveApproval()).toBe(step !== 'routine');
      vi.restoreAllMocks();
    },
  );
});
