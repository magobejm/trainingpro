import { ConflictException, NotFoundException } from '@nestjs/common';
import { EnsureClientSelfSessionUseCase } from '../../../src/modules/clients/application/use-cases/ensure-client-self-session.usecase';

const mockClientsRepository = {
  findClientByEmail: jest.fn(),
};

const mockSessionsRepository = {
  ensureSessionForClient: jest.fn(),
};

const CLIENT_CONTEXT = {
  subject: 'uid-1',
  activeRole: 'client' as const,
  roles: ['client' as const],
  email: 'client@example.com',
};

const FULL_CLIENT = {
  id: 'client-id-1',
  coachMembershipId: 'coach-membership-id-1',
  organizationId: 'org-id-1',
  trainingPlanId: 'plan-id-1',
  email: 'client@example.com',
};

describe('EnsureClientSelfSessionUseCase', () => {
  let useCase: EnsureClientSelfSessionUseCase;

  beforeEach(() => {
    mockClientsRepository.findClientByEmail.mockReset();
    mockSessionsRepository.ensureSessionForClient.mockReset();
    useCase = new EnsureClientSelfSessionUseCase(mockClientsRepository as never, mockSessionsRepository as never);
  });

  it('throws NotFoundException when email is missing from context', async () => {
    const context = { subject: 'uid-1', activeRole: 'client' as const, roles: ['client' as const] };

    await expect(useCase.execute(context as never, { sessionDate: new Date() })).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when client profile is not found', async () => {
    mockClientsRepository.findClientByEmail.mockResolvedValue(null);

    await expect(useCase.execute(CLIENT_CONTEXT, { sessionDate: new Date() })).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when client has no training plan assigned', async () => {
    mockClientsRepository.findClientByEmail.mockResolvedValue({
      ...FULL_CLIENT,
      trainingPlanId: null,
    });

    await expect(useCase.execute(CLIENT_CONTEXT, { sessionDate: new Date() })).rejects.toThrow(ConflictException);
  });

  it('calls ensureSessionForClient with resolved ids when client has a plan and no planDayId', async () => {
    const sessionDate = new Date('2026-04-14');
    const fakeSession = { id: 'session-id-1', sessionDate, status: 'PENDING' };
    mockClientsRepository.findClientByEmail.mockResolvedValue(FULL_CLIENT);
    mockSessionsRepository.ensureSessionForClient.mockResolvedValue(fakeSession);

    const result = await useCase.execute(CLIENT_CONTEXT, { sessionDate });

    expect(mockSessionsRepository.ensureSessionForClient).toHaveBeenCalledWith(CLIENT_CONTEXT, {
      clientId: FULL_CLIENT.id,
      templateId: FULL_CLIENT.trainingPlanId,
      planDayId: undefined,
      sessionDate,
      coachMembershipId: FULL_CLIENT.coachMembershipId,
      organizationId: FULL_CLIENT.organizationId,
    });
    expect(result).toBe(fakeSession);
  });

  it('propagates planDayId when provided', async () => {
    const sessionDate = new Date('2026-04-14');
    const planDayId = 'plan-day-id-1';
    const fakeSession = { id: 'session-id-2', sessionDate, status: 'PENDING' };
    mockClientsRepository.findClientByEmail.mockResolvedValue(FULL_CLIENT);
    mockSessionsRepository.ensureSessionForClient.mockResolvedValue(fakeSession);

    await useCase.execute(CLIENT_CONTEXT, { sessionDate, planDayId });

    expect(mockSessionsRepository.ensureSessionForClient).toHaveBeenCalledWith(
      CLIENT_CONTEXT,
      expect.objectContaining({ planDayId }),
    );
  });
});
