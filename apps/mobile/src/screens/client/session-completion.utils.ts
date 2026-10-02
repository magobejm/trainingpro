import type { SessionItem } from '../../data/hooks/useTodaySession';

function plannedSetCount(item: SessionItem): number {
  switch (item.type) {
    case 'strength':
    case 'isometric':
      return item.setsPlanned ?? 0;
    case 'plio':
    case 'mobility':
    case 'cardio':
      return item.roundsPlanned;
    case 'sport':
      return 1;
    default:
      return 0;
  }
}

function loggedSetIndexes(item: SessionItem): Set<number> {
  switch (item.type) {
    case 'strength':
    case 'plio':
    case 'mobility':
    case 'isometric':
      return new Set(item.logs.map((entry) => entry.setIndex));
    case 'cardio':
      return new Set(item.intervalLogs.map((entry) => entry.intervalIndex));
    case 'sport':
      return item.log != null ? new Set([1]) : new Set();
    default:
      return new Set();
  }
}

export function isSessionItemComplete(item: SessionItem): boolean {
  const total = plannedSetCount(item);
  if (total <= 0) {
    return false;
  }
  const logged = loggedSetIndexes(item);
  for (let setIndex = 1; setIndex <= total; setIndex += 1) {
    if (!logged.has(setIndex)) {
      return false;
    }
  }
  return true;
}

export function isListedExerciseDone(item: SessionItem, finishedIds: ReadonlySet<string> | undefined): boolean {
  return Boolean(finishedIds?.has(item.id)) || isSessionItemComplete(item);
}

export function formatRestLabel(seconds: number): string {
  return `${Math.max(0, Math.round(seconds))} seg`;
}
