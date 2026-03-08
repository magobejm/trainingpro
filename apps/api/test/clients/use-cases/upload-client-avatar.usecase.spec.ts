import { BadRequestException } from '@nestjs/common';
import { UploadClientAvatarUseCase } from '../../../src/modules/clients/application/use-cases/upload-client-avatar.usecase';

const mockStorage = {
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockUpdateClientUseCase = {
  execute: jest.fn(),
};

let useCase: UploadClientAvatarUseCase;

beforeEach(() => {
  mockStorage.upload.mockReset();
  mockStorage.getPublicUrl.mockReset();
  mockUpdateClientUseCase.execute.mockReset();
  useCase = new UploadClientAvatarUseCase(mockStorage as never, mockUpdateClientUseCase as never);
});

it('should upload a valid avatar and update client avatarUrl', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/jpeg',
    originalname: 'avatar.jpg',
    size: 100_000,
  };
  mockStorage.upload.mockResolvedValue(undefined);
  mockStorage.getPublicUrl.mockReturnValue('https://cdn.example.com/avatar.jpg');
  mockUpdateClientUseCase.execute.mockResolvedValue({});

  const result = await useCase.execute(context, 'client-123', file);

  expect(mockStorage.upload).toHaveBeenCalledWith(
    expect.objectContaining({ contentType: 'image/jpeg' }),
  );
  expect(mockUpdateClientUseCase.execute).toHaveBeenCalledWith(context, 'client-123', {
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
  });
  expect(result).toEqual({ avatarUrl: 'https://cdn.example.com/avatar.jpg' });
});

it('should throw BadRequestException for unsupported MIME type', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/gif',
    originalname: 'avatar.gif',
    size: 100_000,
  };

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow(BadRequestException);
  expect(mockStorage.upload).not.toHaveBeenCalled();
});

it('should throw BadRequestException for files exceeding 2MB size limit', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/png',
    originalname: 'big.png',
    size: 3_000_000,
  };

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow(BadRequestException);
  expect(mockStorage.upload).not.toHaveBeenCalled();
});

it('should throw BadRequestException for zero-size files', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from(''),
    mimetype: 'image/png',
    originalname: 'empty.png',
    size: 0,
  };

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow(BadRequestException);
});

it('should propagate storage errors and not update the client', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const file = {
    buffer: Buffer.from('data'),
    mimetype: 'image/webp',
    originalname: 'avatar.webp',
    size: 100_000,
  };
  mockStorage.upload.mockRejectedValue(new Error('Storage unavailable'));

  await expect(useCase.execute(context, 'client-123', file)).rejects.toThrow('Storage unavailable');
  expect(mockUpdateClientUseCase.execute).not.toHaveBeenCalled();
});
