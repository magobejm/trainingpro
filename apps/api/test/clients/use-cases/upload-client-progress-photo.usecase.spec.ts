import { BadRequestException } from '@nestjs/common';
import { UploadClientProgressPhotoUseCase } from '../../../src/modules/clients/application/use-cases/upload-client-progress-photo.usecase';

const mockStorage = {
  upload: jest.fn(),
};

const mockCreatePhotoUseCase = {
  execute: jest.fn(),
};

let useCase: UploadClientProgressPhotoUseCase;

beforeEach(() => {
  mockStorage.upload.mockReset();
  mockCreatePhotoUseCase.execute.mockReset();
  useCase = new UploadClientProgressPhotoUseCase(
    mockStorage as never,
    mockCreatePhotoUseCase as never,
  );
});

it('should upload a valid photo and create progress photo record', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/jpeg',
    originalname: 'progress.jpg',
    size: 500_000,
  };
  const photo = { id: 'photo-1', clientId: 'client-123', imageUrl: 'path' };
  mockStorage.upload.mockResolvedValue(undefined);
  mockCreatePhotoUseCase.execute.mockResolvedValue(photo);

  const result = await useCase.execute(context, 'client-123', file);

  expect(mockStorage.upload).toHaveBeenCalledWith(
    expect.objectContaining({ contentType: 'image/jpeg', upsert: false }),
  );
  expect(mockCreatePhotoUseCase.execute).toHaveBeenCalledWith(
    context,
    'client-123',
    expect.stringContaining('clients/progress/client-123'),
  );
  expect(result).toBe(photo);
});

it('should throw BadRequestException for unsupported MIME type', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/gif',
    originalname: 'photo.gif',
    size: 500_000,
  };

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow(BadRequestException);
  expect(mockStorage.upload).not.toHaveBeenCalled();
});

it('should throw BadRequestException for files exceeding 4MB limit', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/png',
    originalname: 'huge.png',
    size: 5_000_000,
  };

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow(BadRequestException);
  expect(mockStorage.upload).not.toHaveBeenCalled();
});

it('should throw BadRequestException for zero-size files', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from(''),
    mimetype: 'image/png',
    originalname: 'e.png',
    size: 0,
  };

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow(BadRequestException);
});

it('should propagate storage errors and not create DB record', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/webp',
    originalname: 'photo.webp',
    size: 300_000,
  };
  mockStorage.upload.mockRejectedValue(new Error('Storage unavailable'));

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow('Storage unavailable');
  expect(mockCreatePhotoUseCase.execute).not.toHaveBeenCalled();
});
