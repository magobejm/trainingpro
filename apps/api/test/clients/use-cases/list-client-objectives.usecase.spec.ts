import { ListClientObjectivesUseCase } from '../../../src/modules/clients/application/use-cases/list-client-objectives.usecase';

const mockRepository = {
  listObjectives: jest.fn(),
};

describe('ListClientObjectivesUseCase', () => {
  let useCase: ListClientObjectivesUseCase;

  beforeEach(() => {
    mockRepository.listObjectives.mockReset();
    useCase = new ListClientObjectivesUseCase(mockRepository as never);
  });

  it('should return all objectives from repository', async () => {
    const objectives = [
      { id: 'obj-1', code: 'WEIGHT_LOSS', label: 'Perder peso' },
      { id: 'obj-2', code: 'MUSCLE_GAIN', label: 'Ganar músculo' },
    ];
    mockRepository.listObjectives.mockResolvedValue(objectives);

    const result = await useCase.execute();

    expect(mockRepository.listObjectives).toHaveBeenCalledTimes(1);
    expect(result).toBe(objectives);
  });

  it('should return empty array when no objectives exist', async () => {
    mockRepository.listObjectives.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    mockRepository.listObjectives.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute()).rejects.toThrow('DB error');
  });
});
