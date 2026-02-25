import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { ListSportsUseCase } from './list-sports.usecase';

const auth: AuthContext = { subject: 'coach-1', roles: ['coach'], activeRole: 'coach' };

const mockRepository = {
  listSports: jest.fn(),
};

describe('ListSportsUseCase', () => {
  let useCase: ListSportsUseCase;

  beforeEach(() => {
    mockRepository.listSports.mockReset();
    useCase = new ListSportsUseCase(mockRepository as never);
  });

  it('should delegate to repository', async () => {
    const expected = [{ id: '1', name: 'Fútbol', icon: '⚽' }];
    mockRepository.listSports.mockResolvedValue(expected);

    const result = await useCase.execute(auth);

    expect(mockRepository.listSports).toHaveBeenCalledTimes(1);
    expect(result).toBe(expected);
  });

  it('should return empty array when repository returns no items', async () => {
    mockRepository.listSports.mockResolvedValue([]);

    const result = await useCase.execute(auth);

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    mockRepository.listSports.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(auth)).rejects.toThrow('DB error');
  });
});
