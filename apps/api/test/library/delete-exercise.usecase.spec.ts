import { BadRequestException } from '@nestjs/common';
import { DeleteExerciseUseCase } from '../../src/modules/library/application/use-cases/delete-exercise.usecase';

describe('DeleteExerciseUseCase', () => {
  const mockRepository = {
    deleteExercise: jest.fn(),
  };

  let useCase: DeleteExerciseUseCase;

  beforeEach(() => {
    mockRepository.deleteExercise.mockReset();
    useCase = new DeleteExerciseUseCase(mockRepository as never);
  });

  it('delegates delete to repository', async () => {
    const context = { subject: 'coach-a', role: 'coach' } as never;
    mockRepository.deleteExercise.mockResolvedValue(undefined);

    await useCase.execute(context, 'exercise-1');

    expect(mockRepository.deleteExercise).toHaveBeenCalledWith(context, 'exercise-1');
  });

  it('propagates routine usage guard errors from repository', async () => {
    const context = { subject: 'coach-a', role: 'coach' } as never;
    mockRepository.deleteExercise.mockRejectedValue(new BadRequestException('Library item is used in a routine template'));

    await expect(useCase.execute(context, 'exercise-1')).rejects.toThrow(BadRequestException);
  });
});
