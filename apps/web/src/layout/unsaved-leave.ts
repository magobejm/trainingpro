type LeaveGuard = {
  confirmLeave: (proceed: () => void) => void;
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
