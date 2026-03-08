import { GetClientManagementSectionsUseCase } from '../../../src/modules/clients/application/use-cases/get-client-management-sections.usecase';

const mockRepository = {
  getClientManagementSections: jest.fn(),
};

describe('GetClientManagementSectionsUseCase', () => {
  let useCase: GetClientManagementSectionsUseCase;

  beforeEach(() => {
    mockRepository.getClientManagementSections.mockReset();
    useCase = new GetClientManagementSectionsUseCase(mockRepository as never);
  });

  it('should return management sections for a client', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    const sections = [
      { code: 'training', sortOrder: 0, archived: false },
      { code: 'nutrition', sortOrder: 1, archived: false },
    ];
    mockRepository.getClientManagementSections.mockResolvedValue(sections);

    const result = await useCase.execute(context, 'client-123');

    expect(mockRepository.getClientManagementSections).toHaveBeenCalledWith(context, 'client-123');
    expect(result).toBe(sections);
  });

  it('should return empty array when client has no sections', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.getClientManagementSections.mockResolvedValue([]);

    const result = await useCase.execute(context, 'client-123');

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.getClientManagementSections.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, 'client-123')).rejects.toThrow('DB error');
  });
});
