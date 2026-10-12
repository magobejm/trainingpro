type LeaveGuard = {
  confirmLeave: (proceed: () => void, cancel?: () => void) => void;
  isDirty: () => boolean;
};

let guard: LeaveGuard | null = null;

export function registerUnsavedGuard(next: LeaveGuard | null): void {
  guard = next;
}

export function requestUnsavedLeave(proceed: () => void): void {
  if (!guard || !guard.isDirty()) {
    proceed();
    return;
  }
  guard.confirmLeave(proceed);
}

export function isUnsavedDirty(): boolean {
  return Boolean(guard?.isDirty());
}

/** Pide confirmación al usuario antes de abandonar; `cancel` se llama si decide quedarse. */
export function confirmUnsavedLeave(proceed: () => void, cancel: () => void): void {
  if (!guard || !guard.isDirty()) {
    proceed();
    return;
  }
  guard.confirmLeave(proceed, cancel);
}

let leaveApproved = false;

/** Marca que el usuario ya aceptó salir: el bloqueo de navegación deja pasar la siguiente. */
export function approveNextLeave(): void {
  leaveApproved = true;
}

export function consumeLeaveApproval(): boolean {
  const approved = leaveApproved;
  leaveApproved = false;
  return approved;
}
