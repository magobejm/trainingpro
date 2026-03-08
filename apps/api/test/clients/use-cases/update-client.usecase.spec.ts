import { UpdateClientUseCase } from '../../../src/modules/clients/application/use-cases/update-client.usecase';

const mockRepository = {
  updateClient: jest.fn(),
};

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase;

  beforeEach(() => {
    mockRepository.updateClient.mockReset();
    useCase = new UpdateClientUseCase(mockRepository as never);
  });

  it('should delegate update to repository and return updated client', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    const input = { firstName: 'Ana', weightKg: 65 };
    const updated = { id: 'client-123', firstName: 'Ana', weightKg: 65 };
    mockRepository.updateClient.mockResolvedValue(updated);

    const result = await useCase.execute(context, 'client-123', input as never);

    expect(mockRepository.updateClient).toHaveBeenCalledWith(context, 'client-123', input);
    expect(result).toBe(updated);
  });

  it('should propagate repository errors (e.g. client not found)', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.updateClient.mockRejectedValue(new Error('Not found'));

    await expect(useCase.execute(context, 'client-999', {} as never)).rejects.toThrow('Not found');
  });
});
