import { ListMobilityExercisesUseCase } from './list-mobility-exercises.usecase';

const mockRepository = {
  listMobilityExercises: jest.fn(),
};

describe('ListMobilityExercisesUseCase', () => {
  let useCase: ListMobilityExercisesUseCase;

  beforeEach(() => {
    mockRepository.listMobilityExercises.mockReset();
    useCase = new ListMobilityExercisesUseCase(mockRepository as never);
  });

  it('should delegate to repository with context and filter', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    const filter = { query: 'skiping' };
    const expected = [{ id: '1', name: 'Skiping' }];
    mockRepository.listMobilityExercises.mockResolvedValue(expected);

    const result = await useCase.execute(context, filter);

    expect(mockRepository.listMobilityExercises).toHaveBeenCalledWith(context, filter);
    expect(result).toBe(expected);
  });

  it('should return empty array when repository returns no items', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    mockRepository.listMobilityExercises.mockResolvedValue([]);

    const result = await useCase.execute(context, {});

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'user-1', role: 'coach' } as never;
    mockRepository.listMobilityExercises.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, {})).rejects.toThrow('DB error');
  });
});
