import { NotFoundException } from '@nestjs/common';
import { ListClientWellnessUseCase } from '../../../src/modules/clients/application/use-cases/list-client-wellness.usecase';

const range = {
  dateFrom: new Date('2026-09-01T00:00:00.000Z'),
  dateTo: new Date('2026-09-21T00:00:00.000Z'),
};

const sessionRow = {
  id: 'session-1',
  isCompleted: true,
  planDayTitle: 'Push',
  postFatigue: 4,
  postMood: 8,
  postPain: 2,
  preFatigue: 3,
  preMotivation: 7,
  preRecovery: 6,
  sessionDate: new Date('2026-09-15T00:00:00.000Z'),
};

const reportRow = {
  adherencePercent: 80,
  energy: 7,
  id: 'report-1',
  mood: 8,
  reportDate: new Date('2026-09-14T00:00:00.000Z'),
  sleepHours: 7.5,
  weekStartDate: new Date('2026-09-14T00:00:00.000Z'),
};

describe('ListClientWellnessUseCase', () => {
  const prisma = {
    sessionInstance: { findMany: jest.fn() },
    weeklyReport: { findMany: jest.fn() },
  };
  const clientsRepository = {
    canCoachAccessClient: jest.fn(),
    findClientByEmail: jest.fn(),
  };
  let useCase: ListClientWellnessUseCase;

  beforeEach(() => {
    prisma.sessionInstance.findMany.mockReset();
    prisma.weeklyReport.findMany.mockReset();
    clientsRepository.canCoachAccessClient.mockReset();
    clientsRepository.findClientByEmail.mockReset();
    prisma.sessionInstance.findMany.mockResolvedValue([sessionRow]);
    prisma.weeklyReport.findMany.mockResolvedValue([reportRow]);
    useCase = new ListClientWellnessUseCase(prisma as never, clientsRepository as never);
  });

  it('resolves the authenticated client by email when clientId is omitted', async () => {
    const context = clientContext('client@example.com');
    clientsRepository.findClientByEmail.mockResolvedValue({ id: 'client-self' });

    const result = await useCase.execute(context, range);

    expect(clientsRepository.findClientByEmail).toHaveBeenCalledWith('client@example.com');
    expect(prisma.sessionInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clientId: 'client-self' }) }),
    );
    expect(result.summary.reportsCount).toBe(1);
    expect(result.summary.sessionsWithWellness).toBe(1);
    expect(result.sessions[0]?.sessionDate).toBe('2026-09-15');
    expect(result.weeklyReports[0]?.sleepHours).toBe(7.5);
  });

  it('returns wellness for a coach-owned clientId', async () => {
    const context = coachContext();
    clientsRepository.canCoachAccessClient.mockResolvedValue(true);

    const result = await useCase.execute(context, { ...range, clientId: 'client-owned' });

    expect(clientsRepository.canCoachAccessClient).toHaveBeenCalledWith('coach-1', 'client-owned');
    expect(clientsRepository.findClientByEmail).not.toHaveBeenCalled();
    expect(prisma.sessionInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clientId: 'client-owned' }) }),
    );
    expect(result.summary.avgPostMood).toBe(8);
  });

  it('throws NotFoundException when the coach does not own the client', async () => {
    const context = coachContext();
    clientsRepository.canCoachAccessClient.mockResolvedValue(false);

    await expect(useCase.execute(context, { ...range, clientId: 'client-other' })).rejects.toThrow(NotFoundException);
    expect(prisma.sessionInstance.findMany).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when self email is missing', async () => {
    const context = { activeRole: 'client' as const, roles: ['client' as const], subject: 'uid-1' };

    await expect(useCase.execute(context, range)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when self client profile is missing', async () => {
    const context = clientContext('unknown@example.com');
    clientsRepository.findClientByEmail.mockResolvedValue(null);

    await expect(useCase.execute(context, range)).rejects.toThrow(NotFoundException);
  });
});

function clientContext(email: string) {
  return { activeRole: 'client' as const, email, roles: ['client' as const], subject: 'uid-client' };
}

function coachContext() {
  return { activeRole: 'coach' as const, email: 'coach@example.com', roles: ['coach' as const], subject: 'coach-1' };
}
