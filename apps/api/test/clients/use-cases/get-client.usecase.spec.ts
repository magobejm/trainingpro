import { NotFoundException } from '@nestjs/common';
import { GetClientUseCase } from '../../../src/modules/clients/application/use-cases/get-client.usecase';

const mockRepository = {
  getClientById: jest.fn(),
};

describe('GetClientUseCase', () => {
  let useCase: GetClientUseCase;

  beforeEach(() => {
    mockRepository.getClientById.mockReset();
    useCase = new GetClientUseCase(mockRepository as never);
  });

  it('should return the client when found', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    const client = { id: 'client-123', firstName: 'Ana', lastName: 'García' };
    mockRepository.getClientById.mockResolvedValue(client);

    const result = await useCase.execute(context, 'client-123');

    expect(mockRepository.getClientById).toHaveBeenCalledWith(context, 'client-123');
    expect(result).toBe(client);
  });

  it('should throw NotFoundException when client is not found', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.getClientById.mockResolvedValue(null);

    await expect(useCase.execute(context, 'client-999')).rejects.toThrow(NotFoundException);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.getClientById.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, 'client-123')).rejects.toThrow('DB error');
  });
});
