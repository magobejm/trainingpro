import { useEffect, useState } from 'react';
import type { ShellRoute } from './usePersistentShellRoute';
import {
  clearStoredClientSelection,
  LIST_KEYS,
  readListContext,
  replaceClientSearch,
  writeListContext,
  writeRouteClientId,
} from './list-context';
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
  if (route === 'coach.chat') clearChatOrigin();
  if (route === 'coach.incidents') clearIncidentOrigin();
  if (route === 'coach.nutrition') clearNutritionOrigin();
  if (route === 'coach.calendar') {
    clearStoredClientSelection(LIST_KEYS.calendar, { selectedClientId: null, viewMode: 'all' });
  }
  listeners.forEach((listener) => listener());
}

function clearChatOrigin(): void {
  clearProfileOrigin(LIST_KEYS.chat);
}

function clearIncidentOrigin(): void {
  clearProfileOrigin(LIST_KEYS.incidents);
}

function clearNutritionOrigin(): void {
  replaceClientSearch(null);
  const stored = readListContext<Record<string, unknown>>(LIST_KEYS.nutrition);
  if (!stored) return;
  writeListContext(LIST_KEYS.nutrition, { ...stored, originClientId: '', originClientName: '', view: 'hub' });
}

function clearProfileOrigin(key: string): void {
  const stored = readListContext<{ clientId?: string }>(key);
  if (!stored?.clientId) return;
  writeListContext(key, { clientId: stored.clientId, fromProfile: false });
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
