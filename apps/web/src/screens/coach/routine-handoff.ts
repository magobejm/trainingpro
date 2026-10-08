import type { QueryClient } from '@tanstack/react-query';
import { createApiClient } from '../../data/api-client';
import { pickNormalizedPlanTemplateId } from '../../data/normalize-plan-template-id';
import { useAuthStore } from '../../store/auth.store';

export type HandoffChoice = 'continue' | 'replace' | 'cancel';
export type HandoffOutcome = 'assign' | 'replace' | 'cancel' | 'same';

export type PendingWorkoutEvent = {
  type: string;
  date: string | Date;
  isCompleted?: boolean;
};

export type RoutineAssignOptions = {
  clearFutureFrom?: string;
};

export function localCalendarDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addCalendarYears(day: string, years: number): string {
  const date = new Date(`${day.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export function isSameAssignedRoutine(
  currentPlanId: string | null | undefined,
  currentPlanTemplateId: string | null | undefined,
  nextTemplateId: string | null | undefined,
): boolean {
  const current = pickNormalizedPlanTemplateId(currentPlanTemplateId, currentPlanId);
  const next = pickNormalizedPlanTemplateId(nextTemplateId);
  return Boolean(current && next && current === next);
}

export function hasPendingWorkoutFromToday(events: PendingWorkoutEvent[], today: string): boolean {
  return events.some((event) => {
    if (event.type !== 'workout' || event.isCompleted) return false;
    const day = event.date instanceof Date ? event.date.toISOString().slice(0, 10) : event.date.slice(0, 10);
    return day >= today;
  });
}

export async function chooseRoutineHandoff(input: {
  hasOtherRoutine: boolean;
  sameRoutine: boolean;
  today: string;
  loadPending: (from: string, to: string) => Promise<PendingWorkoutEvent[]>;
  ask: () => Promise<HandoffChoice>;
}): Promise<HandoffOutcome> {
  if (input.sameRoutine) return 'same';
  if (!input.hasOtherRoutine) return 'assign';
  const events = await input.loadPending(input.today, addCalendarYears(input.today, 3));
  if (!hasPendingWorkoutFromToday(events, input.today)) return 'assign';
  const choice = await input.ask();
  if (choice === 'replace') return 'replace';
  if (choice === 'cancel') return 'cancel';
  return 'assign';
}

function requireAuth() {
  const { accessToken, activeRole } = useAuthStore.getState();
  if (!accessToken || !activeRole) throw new Error('Not authenticated');
  return createApiClient({ accessToken, activeRole });
}

export async function loadClientCalendarEvents(clientId: string, from: string, to: string): Promise<PendingWorkoutEvent[]> {
  const response = await requireAuth().get<{ data: PendingWorkoutEvent[] }>('/calendar', {
    clientId,
    dateFrom: from,
    dateTo: to,
  });
  return response.data ?? [];
}

export async function assignClientRoutine(input: {
  hasOtherRoutine: boolean;
  sameRoutine: boolean;
  assign: () => Promise<void>;
  archive: (from: string) => Promise<void>;
  openCalendar: () => void;
  loadPending: (from: string, to: string) => Promise<PendingWorkoutEvent[]>;
  ask: () => Promise<HandoffChoice>;
}): Promise<void> {
  const today = localCalendarDay();
  const outcome = await chooseRoutineHandoff({
    ask: input.ask,
    hasOtherRoutine: input.hasOtherRoutine,
    loadPending: input.loadPending,
    sameRoutine: input.sameRoutine,
    today,
  });
  if (outcome === 'cancel') return;
  if (outcome !== 'same') {
    await input.assign();
    if (outcome === 'replace') await input.archive(today);
  }
  input.openCalendar();
}

export async function archiveFutureWorkouts(queryClient: QueryClient, clientId: string, from: string): Promise<void> {
  await requireAuth().post('/calendar/clear-future-workouts', { clientId, from });
  await queryClient.invalidateQueries({ queryKey: ['calendar'] });
}
