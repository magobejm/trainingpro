import { useEffect, useState } from 'react';
import type { ShellRoute } from './usePersistentShellRoute';
import { clearStoredClientSelection, LIST_KEYS, writeRouteClientId } from './list-context';
import { useCalendarContextStore } from '../store/calendarContext.store';
import { useNutritionContextStore } from '../store/nutritionContext.store';
import { useProgressContextStore } from '../store/progressContext.store';
import { useRoutinePlannerContextStore } from '../store/routinePlannerContext.store';
import { useWarmupPlannerContextStore } from '../store/warmupPlannerContext.store';

const listeners = new Set<() => void>();

export function applyMenuClientReset(route: ShellRoute): void {
  writeRouteClientId(null);
  useRoutinePlannerContextStore.getState().clear();
  useProgressContextStore.getState().clear();
  useNutritionContextStore.getState().clear();
  useCalendarContextStore.getState().consumeFocusClientId();
  if (route === 'coach.warmup.planner') useWarmupPlannerContextStore.getState().clear();
  if (route === 'coach.clients') {
    clearStoredClientSelection(LIST_KEYS.clients, { screenMode: 'list', selectedClientId: '' });
  }
  if (route === 'coach.calendar') {
    clearStoredClientSelection(LIST_KEYS.calendar, { selectedClientId: null, viewMode: 'all' });
  }
  listeners.forEach((listener) => listener());
}

export function useMenuEpoch(): number {
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const listener = () => setEpoch((current) => current + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return epoch;
}
