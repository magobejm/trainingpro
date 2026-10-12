import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { confirmUnsavedLeave, consumeLeaveApproval, isUnsavedDirty } from './unsaved-leave';

/**
 * Si hay cambios sin guardar, cualquier cambio de pantalla (menú, enlaces, botón atrás del
 * navegador…) pide confirmación antes de salir. Si el usuario decide quedarse, la navegación se cancela.
 */
export function useUnsavedLeaveBlocker(): void {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (currentLocation.pathname === nextLocation.pathname) return false;
    return !consumeLeaveApproval() && isUnsavedDirty();
  });
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirmUnsavedLeave(
      () => blocker.proceed(),
      () => blocker.reset(),
    );
  }, [blocker]);
}
