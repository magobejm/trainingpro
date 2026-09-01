import type { SessionItem } from '../../data/hooks/useTodaySession';

export function isSessionItemComplete(item: SessionItem): boolean {
  switch (item.type) {
    case 'strength': {
      const total = item.setsPlanned ?? 0;
      return total > 0 && item.logs.length >= total;
    }
    case 'plio':
    case 'mobility':
      return item.roundsPlanned > 0 && item.logs.length >= item.roundsPlanned;
    case 'isometric': {
      const total = item.setsPlanned ?? 0;
      return total > 0 && item.logs.length >= total;
    }
    case 'sport':
      return item.log != null;
    case 'cardio':
      return item.roundsPlanned > 0 && item.intervalLogs.length >= item.roundsPlanned;
    default:
      return false;
  }
}

export function formatRestLabel(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainder}s`;
}
