import { NotFoundException } from '@nestjs/common';
import { GetClientRoutineUseCase } from '../../../src/modules/clients/application/use-cases/get-client-routine.usecase';

const mockRepository = {
  presentClientRoutine: jest.fn(),
};

describe('GetClientRoutineUseCase', () => {
  let useCase: GetClientRoutineUseCase;

  beforeEach(() => {
    mockRepository.presentClientRoutine.mockReset();
    useCase = new GetClientRoutineUseCase(mockRepository as never);
  });

  it('returns routine when client has an assigned plan', async () => {
    const context = {
      subject: 'uid-1',
      activeRole: 'client' as const,
      roles: ['client' as const],
      email: 'client@example.com',
    };
    const routine = { id: 'plan-id', name: 'Torso / Pierna', planDays: [] };
    mockRepository.presentClientRoutine.mockResolvedValue(routine);

    const result = await useCase.execute(context);

    expect(mockRepository.presentClientRoutine).toHaveBeenCalledWith('client@example.com');
    expect(result).toBe(routine);
  });

  it('throws NotFoundException when email is missing', async () => {
    const context = { subject: 'uid-1', activeRole: 'client' as const, roles: ['client' as const] };

    await expect(useCase.execute(context as never)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when no routine is assigned', async () => {
    const context = {
      subject: 'uid-1',
      activeRole: 'client' as const,
      roles: ['client' as const],
      email: 'client@example.com',
    };
    mockRepository.presentClientRoutine.mockResolvedValue(null);

    await expect(useCase.execute(context)).rejects.toThrow(NotFoundException);
  });
});
