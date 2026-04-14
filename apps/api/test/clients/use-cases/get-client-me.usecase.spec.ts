import { NotFoundException } from '@nestjs/common';
import { GetClientMeUseCase } from '../../../src/modules/clients/application/use-cases/get-client-me.usecase';

const mockRepository = {
  findClientByEmail: jest.fn(),
};

describe('GetClientMeUseCase', () => {
  let useCase: GetClientMeUseCase;

  beforeEach(() => {
    mockRepository.findClientByEmail.mockReset();
    useCase = new GetClientMeUseCase(mockRepository as never);
  });

  it('returns client when found by email', async () => {
    const context = {
      subject: 'uid-1',
      activeRole: 'client' as const,
      roles: ['client' as const],
      email: 'client@example.com',
    };
    const client = { id: 'client-123', firstName: 'Ana', lastName: 'García' };
    mockRepository.findClientByEmail.mockResolvedValue(client);

    const result = await useCase.execute(context);

    expect(mockRepository.findClientByEmail).toHaveBeenCalledWith('client@example.com');
    expect(result).toBe(client);
  });

  it('throws NotFoundException when email is missing from context', async () => {
    const context = { subject: 'uid-1', activeRole: 'client' as const, roles: ['client' as const] };

    await expect(useCase.execute(context as never)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when client is not found', async () => {
    const context = {
      subject: 'uid-1',
      activeRole: 'client' as const,
      roles: ['client' as const],
      email: 'unknown@example.com',
    };
    mockRepository.findClientByEmail.mockResolvedValue(null);

    await expect(useCase.execute(context)).rejects.toThrow(NotFoundException);
  });
});
