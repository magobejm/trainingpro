import { SetClientProgressPhotoArchivedUseCase } from '../../../src/modules/clients/application/use-cases/set-client-progress-photo-archived.usecase';

const mockRepository = {
  setProgressPhotoArchived: jest.fn(),
};

let useCase: SetClientProgressPhotoArchivedUseCase;

beforeEach(() => {
  mockRepository.setProgressPhotoArchived.mockReset();
  useCase = new SetClientProgressPhotoArchivedUseCase(mockRepository as never);
});

it('should archive a photo when archived=true', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const photo = { id: 'photo-1', archived: true, imageUrl: 'http://img.url' };
  mockRepository.setProgressPhotoArchived.mockResolvedValue(photo);

  const result = await useCase.execute(context, 'client-123', 'photo-1', true);

  expect(mockRepository.setProgressPhotoArchived).toHaveBeenCalledWith(
    context,
    'client-123',
    'photo-1',
    true,
  );
  expect(result.archived).toBe(true);
});

it('should restore a photo when archived=false', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const photo = { id: 'photo-1', archived: false };
  mockRepository.setProgressPhotoArchived.mockResolvedValue(photo);

  const result = await useCase.execute(context, 'client-123', 'photo-1', false);
  expect(result.archived).toBe(false);
});

it('should propagate not-found errors from repository', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockRepository.setProgressPhotoArchived.mockRejectedValue(new Error('Progress photo not found'));

  await expect(useCase.execute(context, 'client-123', 'bad-id', true)).rejects.toThrow(
    'Progress photo not found',
  );
});
