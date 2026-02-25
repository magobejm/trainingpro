import { ListWarmupExercisesUseCase } from './list-warmup-exercises.usecase';

const mockRepository = {
  listWarmupExercises: jest.fn(),
};

describe('ListWarmupExercisesUseCase', () => {
  let useCase: ListWarmupExercisesUseCase;

  beforeEach(() => {
    mockRepository.listWarmupExercises.mockReset();
    useCase = new ListWarmupExercisesUseCase(mockRepository as never);
  });

  it('should delegate to repository with context and filter', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    const filter = { query: 'skiping' };
    const expected = [{ id: '1', name: 'Skiping' }];
    mockRepository.listWarmupExercises.mockResolvedValue(expected);

    const result = await useCase.execute(context, filter);

    expect(mockRepository.listWarmupExercises).toHaveBeenCalledWith(context, filter);
    expect(result).toBe(expected);
  });

  it('should return empty array when repository returns no items', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    mockRepository.listWarmupExercises.mockResolvedValue([]);

    const result = await useCase.execute(context, {});

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    mockRepository.listWarmupExercises.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, {})).rejects.toThrow('DB error');
  });
});
