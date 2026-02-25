import { ListPlioExercisesUseCase } from './list-plio-exercises.usecase';

const mockRepository = {
  listPlioExercises: jest.fn(),
};

describe('ListPlioExercisesUseCase', () => {
  let useCase: ListPlioExercisesUseCase;

  beforeEach(() => {
    mockRepository.listPlioExercises.mockReset();
    useCase = new ListPlioExercisesUseCase(mockRepository as never);
  });

  it('should delegate to repository with context and filter', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    const filter = { query: 'salto' };
    const expected = [{ id: '1', name: 'Salto al cajón' }];
    mockRepository.listPlioExercises.mockResolvedValue(expected);

    const result = await useCase.execute(context, filter);

    expect(mockRepository.listPlioExercises).toHaveBeenCalledWith(context, filter);
    expect(result).toBe(expected);
  });

  it('should return empty array when repository returns no items', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    mockRepository.listPlioExercises.mockResolvedValue([]);

    const result = await useCase.execute(context, {});

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    mockRepository.listPlioExercises.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, {})).rejects.toThrow('DB error');
  });
});
