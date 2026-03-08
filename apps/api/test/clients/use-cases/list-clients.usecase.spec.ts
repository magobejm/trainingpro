import { ListClientsUseCase } from '../../../src/modules/clients/application/use-cases/list-clients.usecase';

const mockRepository = {
  listClientsByCoach: jest.fn(),
};

describe('ListClientsUseCase', () => {
  let useCase: ListClientsUseCase;

  beforeEach(() => {
    mockRepository.listClientsByCoach.mockReset();
    useCase = new ListClientsUseCase(mockRepository as never);
  });

  it('should return clients for the authenticated coach', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    const clients = [
      { id: 'client-1', firstName: 'Ana' },
      { id: 'client-2', firstName: 'Pedro' },
    ];
    mockRepository.listClientsByCoach.mockResolvedValue(clients);

    const result = await useCase.execute(context);

    expect(mockRepository.listClientsByCoach).toHaveBeenCalledWith(context);
    expect(result).toBe(clients);
  });

  it('should return empty array when coach has no clients', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.listClientsByCoach.mockResolvedValue([]);

    const result = await useCase.execute(context);

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.listClientsByCoach.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context)).rejects.toThrow('DB error');
  });
});
