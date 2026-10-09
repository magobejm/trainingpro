import { ListCalendarEventsUseCase } from '../../src/modules/calendar/application/use-cases/list-calendar-events.usecase';

/**
 * La nota del cliente vive en su propia tabla. El calendario del coach solo lee
 * calendarEvent y callProposal, así que esa nota no puede colarse en su lista.
 */
describe('coach calendar and client notes', () => {
  const repository = { list: jest.fn() };
  const physicalTests = { listScheduleCalendarRows: jest.fn() };
  const prisma = {
    organizationMember: { findFirst: jest.fn() },
    sessionInstance: { findMany: jest.fn() },
    callProposal: { findMany: jest.fn() },
  };
  const coach = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'coach-uid' };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: 'membership-1' });
    prisma.sessionInstance.findMany.mockResolvedValue([]);
    prisma.callProposal.findMany.mockResolvedValue([]);
    physicalTests.listScheduleCalendarRows.mockResolvedValue([]);
  });

  it('returns only calendar events and pending proposals, never client day notes', async () => {
    repository.list.mockResolvedValue([
      {
        clientId: 'client-1',
        coachMembershipId: 'membership-1',
        color: null,
        content: 'Nota del entrenador',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        date: new Date('2026-10-20T00:00:00.000Z'),
        id: 'note-1',
        originDate: null,
        planDayId: null,
        time: null,
        title: null,
        type: 'note',
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
    ]);

    const result = await new ListCalendarEventsUseCase(repository as never, prisma as never, physicalTests as never).execute(
      coach,
      {
        clientId: 'client-1',
        dateFrom: new Date('2026-10-01'),
        dateTo: new Date('2026-10-31'),
      },
    );

    expect(result.data.map((event) => event.type)).toEqual(['note']);
    expect(JSON.stringify(result.data)).not.toContain('client_note');
    expect(prisma.callProposal.findMany).toHaveBeenCalledTimes(1);
  });
});
