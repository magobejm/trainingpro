import { create } from 'zustand';
import type { NotificationTarget } from '../data/notification-routing';

export type PendingNotice = {
  data: Record<string, unknown>;
  id: string;
};

type NotificationTargetState = {
  clear: () => void;
  clearNotice: () => void;
  notice: PendingNotice | null;
  setNotice: (notice: PendingNotice) => void;
  setTarget: (target: NotificationTarget) => void;
  target: NotificationTarget | null;
};

export const useNotificationTargetStore = create<NotificationTargetState>((set) => ({
  clear: () => set({ target: null }),
  clearNotice: () => set({ notice: null }),
  notice: null,
  setNotice: (notice) => set({ notice }),
  setTarget: (target) => set({ target }),
  target: null,
}));
