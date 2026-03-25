import { ListRoutineObjectivesUseCase } from '../../../src/modules/plans/application/use-cases/list-routine-objectives.usecase';

type RawRow = {
  id: string;
  code: string;
  label: string;
  sort_order: number;
  is_default: boolean;
};

const mockRepository = {
  listRoutineObjectives: jest.fn<Promise<RawRow[]>, []>(),
};

describe('ListRoutineObjectivesUseCase', () => {
  let useCase: ListRoutineObjectivesUseCase;

  beforeEach(() => {
    mockRepository.listRoutineObjectives.mockReset();
    useCase = new ListRoutineObjectivesUseCase(mockRepository as never);
  });

  it('should map raw DB rows to camelCase view objects', async () => {
    const rows: RawRow[] = [
      { id: 'uuid-1', code: 'hipertrofia', label: 'Hipertrofia', sort_order: 20, is_default: false },
      { id: 'uuid-2', code: 'fuerza_maxima', label: 'Fuerza máxima', sort_order: 10, is_default: false },
    ];
    mockRepository.listRoutineObjectives.mockResolvedValue(rows);

    const result = await useCase.execute();

    expect(mockRepository.listRoutineObjectives).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: 'uuid-1', code: 'hipertrofia', label: 'Hipertrofia', sortOrder: 20, isDefault: false },
      { id: 'uuid-2', code: 'fuerza_maxima', label: 'Fuerza máxima', sortOrder: 10, isDefault: false },
    ]);
  });

  it('should return empty array when catalog is empty', async () => {
    mockRepository.listRoutineObjectives.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    mockRepository.listRoutineObjectives.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute()).rejects.toThrow('DB error');
  });
});
