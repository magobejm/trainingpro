import { ListClientCalendarUseCase } from '../../../src/modules/clients/application/use-cases/list-client-calendar.usecase';

describe('ListClientCalendarUseCase', () => {
  it('includes a pending call with who proposed it', async () => {
    const date = new Date('2026-10-13T00:00:00.000Z');
    const prisma = {
      calendarEvent: { findMany: jest.fn().mockResolvedValue([]) },
      callProposal: {
        findMany: jest.fn().mockResolvedValue([
          {
            date,
            id: 'proposal-1',
            initiatedBy: 'COACH',
            lastProposedBy: 'COACH',
            proposedTime: '17:15',
          },
        ]),
      },
      client: { findFirst: jest.fn().mockResolvedValue({ id: 'client-1' }) },
      clientDayNote: { findMany: jest.fn().mockResolvedValue([]) },
      sessionInstance: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const physicalTests = { listScheduleCalendarRows: jest.fn().mockResolvedValue([]) };
    const useCase = new ListClientCalendarUseCase(prisma as never, physicalTests as never);

    const result = await useCase.execute({ email: 'cliente@example.com' } as never, { dateFrom: date, dateTo: date });

    expect(result.data).toEqual([
      expect.objectContaining({
        callStatus: 'pending',
        initiatedBy: 'COACH',
        lastProposedBy: 'COACH',
        proposalId: 'proposal-1',
        time: '17:15',
        type: 'call',
      }),
    ]);
  });
});
