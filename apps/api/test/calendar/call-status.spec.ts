import { pendingProposalAsEvent, withCallStatus } from '../../src/modules/calendar/domain/call-status';
import type { CalendarEventEntity } from '../../src/modules/calendar/domain/calendar.repository.port';

const base: CalendarEventEntity = {
  clientId: 'client-1',
  coachMembershipId: 'membership-1',
  color: null,
  content: null,
  createdAt: new Date('2026-10-20T00:00:00.000Z'),
  date: new Date('2026-10-20T00:00:00.000Z'),
  id: 'event-1',
  originDate: null,
  planDayId: null,
  time: '17:15',
  title: null,
  type: 'reminder',
  updatedAt: new Date('2026-10-20T00:00:00.000Z'),
};

describe('withCallStatus', () => {
  it('marks accepted calls and leaves old reminders unconfirmed', () => {
    expect(withCallStatus({ ...base, type: 'call' }).callStatus).toBe('accepted');
    expect(withCallStatus(base).callStatus).toBe('unconfirmed');
    expect(withCallStatus({ ...base, type: 'note' }).callStatus).toBeUndefined();
  });
});

describe('pendingProposalAsEvent', () => {
  it('shows a pending proposal as a call that is not yet on the calendar', () => {
    const event = pendingProposalAsEvent({
      clientId: 'client-1',
      coachMembershipId: 'membership-1',
      date: new Date('2026-10-20T00:00:00.000Z'),
      id: 'proposal-1',
      proposedTime: '18:00',
    });
    expect(event).toMatchObject({ callStatus: 'pending', id: 'proposal-1', time: '18:00', type: 'call' });
  });
});
