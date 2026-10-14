import { useEffect } from 'react';
import { useQuickCreateStore } from '../../store/quickCreate.store';
import type { ModalState } from './CalendarScreen.handlers';

function localDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function useOpenTodayFromQuickCreate(setModal: (modal: ModalState) => void): void {
  const intent = useQuickCreateStore((state) => state.intent);
  useEffect(() => {
    if (intent !== 'calendar') return;
    useQuickCreateStore.getState().consume();
    setModal({ dateStr: localDateString(new Date()), type: 'day' });
  }, [intent, setModal]);
}
