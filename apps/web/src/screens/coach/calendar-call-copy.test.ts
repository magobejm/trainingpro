import { expect, it, vi } from 'vitest';
import { createCopyPasteHandlers } from './CalendarScreen.handlers';
import type { CalendarEventData } from './calendar-screen.types';

it.each(['day', 'week'] as const)('copies a call via a pending proposal for a %s', (type) => {
  const call = {
    id: 'call',
    type: 'call',
    clientId: 'client',
    date: new Date('2026-10-20'),
    time: '09:00',
  } as CalendarEventData;
  const createEvent = { mutate: vi.fn() };
  const proposeCall = { mutate: vi.fn() };
  const clipboard =
    type === 'day'
      ? { type, sourceDate: '2026-10-20', events: [call] }
      : { type, sourceDates: ['2026-10-20'], events: [call] };
  const handlers = createCopyPasteHandlers(createEvent as never, clipboard, vi.fn(), [call], proposeCall as never);
  if (type === 'day') handlers.handlePasteDay('2026-10-22');
  else handlers.handlePasteWeek(['2026-10-22']);
  expect(proposeCall.mutate).toHaveBeenCalledWith({ clientId: 'client', date: '2026-10-22', time: '09:00' });
  expect(createEvent.mutate).not.toHaveBeenCalled();
});
