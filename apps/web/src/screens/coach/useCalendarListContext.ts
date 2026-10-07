import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { ClientView } from '../../data/hooks/useClientsQuery';
import { LIST_KEYS, readRouteClientId } from '../../layout/list-context';
import { useMenuEpoch } from '../../layout/menu-client-context';
import { useListContext, useRouteClient } from '../../layout/useListContext';
import { useCalendarContextStore } from '../../store/calendarContext.store';

type ViewMode = 'all' | 'coachOnly';

type CalendarListContext = {
  month: number;
  selectedClientId: string | null;
  viewMode: ViewMode;
  year: number;
};

export function useCalendarListContext(clients: ClientView[]) {
  const [list, setList] = useListContext(LIST_KEYS.calendar, emptyCalendar(), reviveCalendar);
  const epoch = useMenuEpoch();
  useClearClientOnMenu(epoch, setList);
  useFocusAssignedClient(clients, setList);
  useRouteClient(list.selectedClientId ?? '');
  const setMonth = useNumberField(setList, 'month');
  const setYear = useNumberField(setList, 'year');
  const setSelectedClient = useCallback(
    (client: ClientView | null) => {
      setList((prev) => ({
        ...prev,
        selectedClientId: client?.id ?? null,
        viewMode: client ? 'all' : prev.viewMode,
      }));
    },
    [setList],
  );
  const setCoachOnlyView = useCallback(() => {
    setList((prev) => ({ ...prev, selectedClientId: null, viewMode: 'coachOnly' }));
  }, [setList]);
  const setAllView = useCallback(() => {
    setList((prev) => ({ ...prev, selectedClientId: null, viewMode: 'all' }));
  }, [setList]);
  return {
    month: list.month,
    selectedClientId: list.selectedClientId,
    setAllView,
    setCoachOnlyView,
    setMonth,
    setSelectedClient,
    setYear,
    viewMode: list.viewMode,
    year: list.year,
  };
}

function useClearClientOnMenu(epoch: number, setList: Dispatch<SetStateAction<CalendarListContext>>): void {
  useEffect(() => {
    if (epoch === 0) return;
    setList((prev) => ({ ...prev, selectedClientId: null, viewMode: 'all' }));
  }, [epoch, setList]);
}

function useFocusAssignedClient(clients: ClientView[], setList: Dispatch<SetStateAction<CalendarListContext>>): void {
  const focusClientId = useCalendarContextStore((state) => state.focusClientId);
  const consumeFocusClientId = useCalendarContextStore((state) => state.consumeFocusClientId);
  useEffect(() => {
    if (!focusClientId || clients.length === 0) return;
    const client = clients.find((item) => item.id === focusClientId);
    if (!client) return;
    setList((prev) => ({ ...prev, selectedClientId: client.id, viewMode: 'all' }));
    consumeFocusClientId();
  }, [clients, consumeFocusClientId, focusClientId, setList]);
}

function useNumberField(
  setList: Dispatch<SetStateAction<CalendarListContext>>,
  field: 'month' | 'year',
): Dispatch<SetStateAction<number>> {
  return useCallback(
    (action) => {
      setList((prev) => ({
        ...prev,
        [field]: typeof action === 'function' ? action(prev[field]) : action,
      }));
    },
    [field, setList],
  );
}

function emptyCalendar(): CalendarListContext {
  const now = new Date();
  return { month: now.getMonth(), selectedClientId: null, viewMode: 'all', year: now.getFullYear() };
}

function reviveCalendar(stored: CalendarListContext | null, initial: CalendarListContext): CalendarListContext {
  const base = stored ?? initial;
  const urlClient = readRouteClientId();
  if (!urlClient) return base;
  return { ...base, selectedClientId: urlClient, viewMode: 'all' };
}
