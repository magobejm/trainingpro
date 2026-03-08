import { ArchiveClientUseCase } from '../../../src/modules/clients/application/use-cases/archive-client.usecase';

const mockRepository = {
  archiveClient: jest.fn(),
};

describe('ArchiveClientUseCase', () => {
  let useCase: ArchiveClientUseCase;

  beforeEach(() => {
    mockRepository.archiveClient.mockReset();
    useCase = new ArchiveClientUseCase(mockRepository as never);
  });

  it('should delegate to repository with context and clientId', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.archiveClient.mockResolvedValue(undefined);

    await useCase.execute(context, 'client-123');

    expect(mockRepository.archiveClient).toHaveBeenCalledWith(context, 'client-123');
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.archiveClient.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, 'client-123')).rejects.toThrow('DB error');
  });
});
