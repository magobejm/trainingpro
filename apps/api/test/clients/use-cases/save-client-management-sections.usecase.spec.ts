import { SaveClientManagementSectionsUseCase } from '../../../src/modules/clients/application/use-cases/save-client-management-sections.usecase';

const mockRepository = {
  saveClientManagementSections: jest.fn(),
};

let useCase: SaveClientManagementSectionsUseCase;

beforeEach(() => {
  mockRepository.saveClientManagementSections.mockReset();
  useCase = new SaveClientManagementSectionsUseCase(mockRepository as never);
});

it('should save sections and return updated list', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const items = [
    { code: 'training', sortOrder: 0, archived: false },
    { code: 'nutrition', sortOrder: 1, archived: true },
  ] as never[];
  mockRepository.saveClientManagementSections.mockResolvedValue(items);

  const result = await useCase.execute(context, 'client-123', items);

  expect(mockRepository.saveClientManagementSections).toHaveBeenCalledWith(
    context,
    'client-123',
    items,
  );
  expect(result).toBe(items);
});

it('should handle saving an empty list (clearing all sections)', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockRepository.saveClientManagementSections.mockResolvedValue([]);

  const result = await useCase.execute(context, 'client-123', []);
  expect(result).toEqual([]);
});

it('should propagate repository errors', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockRepository.saveClientManagementSections.mockRejectedValue(new Error('DB error'));

  await expect(useCase.execute(context, 'client-123', [])).rejects.toThrow('DB error');
});
