import { create } from 'zustand';

type CalendarContextState = {
  focusClientId: null | string;
  consumeFocusClientId: () => null | string;
  openForClient: (clientId: string) => void;
};

export const useCalendarContextStore = create<CalendarContextState>((set, get) => ({
  focusClientId: null,
  consumeFocusClientId: () => {
    const id = get().focusClientId;
    if (id) set({ focusClientId: null });
    return id;
  },
  openForClient: (clientId) => set({ focusClientId: clientId }),
}));
