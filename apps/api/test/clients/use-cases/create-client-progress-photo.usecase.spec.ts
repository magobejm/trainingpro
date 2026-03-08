import { CreateClientProgressPhotoUseCase } from '../../../src/modules/clients/application/use-cases/create-client-progress-photo.usecase';

const mockRepository = {
  createProgressPhoto: jest.fn(),
};

describe('CreateClientProgressPhotoUseCase', () => {
  let useCase: CreateClientProgressPhotoUseCase;

  beforeEach(() => {
    mockRepository.createProgressPhoto.mockReset();
    useCase = new CreateClientProgressPhotoUseCase(mockRepository as never);
  });

  it('should delegate to repository with context, clientId and imageUrl', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    const photo = { id: 'photo-1', clientId: 'client-123', imageUrl: 'http://img.url' };
    mockRepository.createProgressPhoto.mockResolvedValue(photo);

    const result = await useCase.execute(context, 'client-123', 'http://img.url');

    expect(mockRepository.createProgressPhoto).toHaveBeenCalledWith(
      context,
      'client-123',
      'http://img.url',
    );
    expect(result).toBe(photo);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.createProgressPhoto.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, 'client-123', 'http://img.url')).rejects.toThrow(
      'DB error',
    );
  });
});
