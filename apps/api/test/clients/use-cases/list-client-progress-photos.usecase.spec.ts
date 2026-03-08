import { ListClientProgressPhotosUseCase } from '../../../src/modules/clients/application/use-cases/list-client-progress-photos.usecase';

const mockRepository = {
  listProgressPhotos: jest.fn(),
};

describe('ListClientProgressPhotosUseCase', () => {
  let useCase: ListClientProgressPhotosUseCase;

  beforeEach(() => {
    mockRepository.listProgressPhotos.mockReset();
    useCase = new ListClientProgressPhotosUseCase(mockRepository as never);
  });

  it('should return all progress photos (visible and archived) for a client', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    const photos = [
      { id: 'p1', archived: false, imageUrl: 'http://img1.url' },
      { id: 'p2', archived: true, imageUrl: 'http://img2.url' },
    ];
    mockRepository.listProgressPhotos.mockResolvedValue(photos);

    const result = await useCase.execute(context, 'client-123');

    expect(mockRepository.listProgressPhotos).toHaveBeenCalledWith(context, 'client-123');
    expect(result).toBe(photos);
  });

  it('should return empty array when no photos exist', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.listProgressPhotos.mockResolvedValue([]);

    const result = await useCase.execute(context, 'client-123');

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const context = { subject: 'coach-1', role: 'coach' } as never;
    mockRepository.listProgressPhotos.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(context, 'client-123')).rejects.toThrow('DB error');
  });
});
