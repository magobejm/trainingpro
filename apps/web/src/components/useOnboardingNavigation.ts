import { useLocation, useNavigate } from 'react-router';
import { useClientsQuery } from '../data/hooks/useClientsQuery';
import { onboardingClient, type OnboardingStep } from '../data/onboarding';
import { LIST_KEYS, readListContext, writeListContext } from '../layout/list-context';
import { SHELL_PATHS } from '../layout/shell-routes';
import { useQuickCreateStore } from '../store/quickCreate.store';
import { useRoutinePlannerContextStore } from '../store/routinePlannerContext.store';
import { approveNextLeave, isUnsavedDirty, requestUnsavedLeave } from '../layout/unsaved-leave';

export function useOnboardingNavigation(onNavigate?: () => void) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const clients = useClientsQuery();
  return (step: OnboardingStep) =>
    requestUnsavedLeave(() => {
      const navigate = (path: string) => {
        if (location.pathname !== path && isUnsavedDirty()) approveNextLeave();
        routerNavigate(path);
      };
      onNavigate?.();
      if (step === 'client') {
        useQuickCreateStore.getState().request('client');
        navigate(SHELL_PATHS['coach.clients']);
      } else if (step === 'routine') {
        useRoutinePlannerContextStore.getState().openBlankFromLibrary();
        navigate(SHELL_PATHS['coach.routine.planner']);
      } else {
        const client = onboardingClient(clients.data ?? [], step);
        if (!client) {
          navigate(SHELL_PATHS['coach.clients']);
          return;
        }
        if (step === 'assignment') {
          const displayName = `${client.firstName} ${client.lastName}`.trim();
          useRoutinePlannerContextStore.getState().prepareClientAssignment(client.id, displayName);
          navigate(SHELL_PATHS['coach.library.routines']);
        } else {
          const selected = readListContext<{ clientId: string }>(LIST_KEYS.chat);
          const current = clients.data?.find((item) => item.id === selected?.clientId) ?? client;
          writeListContext(LIST_KEYS.chat, { clientId: current.id });
          navigate(SHELL_PATHS['coach.chat']);
        }
      }
    });
}
