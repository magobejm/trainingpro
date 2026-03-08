import { DeleteClientProgressPhotoUseCase } from '../../../src/modules/clients/application/use-cases/delete-client-progress-photo.usecase';

const mockRepository = {
  deleteProgressPhoto: jest.fn(),
};

describe('DeleteClientProgressPhotoUseCase', () => {
  let useCase: DeleteClientProgressPhotoUseCase;

  beforeEach(() => {
    mockRepository.deleteProgressPhoto.mockReset();
    useCase = new DeleteClientProgressPhotoUseCase(mockRepository as never);
  });

  it('should delegate to repository with context, clientId and photoId', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.deleteProgressPhoto.mockResolvedValue(undefined);

    await useCase.execute(context, 'client-123', 'photo-456');

    expect(mockRepository.deleteProgressPhoto).toHaveBeenCalledWith(
      context,
      'client-123',
      'photo-456',
    );
  });

  it('should propagate not-found errors from repository', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.deleteProgressPhoto.mockRejectedValue(new Error('Photo not found'));

    await expect(useCase.execute(context, 'client-123', 'bad-id')).rejects.toThrow(
      'Photo not found',
    );
  });

  it('should propagate DB errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.deleteProgressPhoto.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, 'client-123', 'photo-456')).rejects.toThrow('DB error');
  });
});
