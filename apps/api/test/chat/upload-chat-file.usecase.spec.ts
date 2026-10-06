import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { UploadChatFileUseCase } from '../../src/modules/chat/application/use-cases/upload-chat-file.usecase';
import type { ChatThreadAccessService } from '../../src/modules/chat/infra/prisma/chat-thread-access.service';
import { FILE_MAX_SIZE_BYTES } from '../../src/modules/files/domain/file.constants';
import { FileUploadPolicy } from '../../src/modules/files/domain/policies/file-upload.policy';
import type { PrivateFileStoragePort } from '../../src/modules/files/domain/private-file-storage.port';

const THREAD = '11111111-1111-4111-8111-111111111111';

const coach: AuthContext = {
  activeRole: 'coach',
  email: 'coach@fitcoach.local',
  roles: ['coach'],
  subject: 'coach-1',
};

describe('UploadChatFileUseCase', () => {
  it('stores an image, a pdf and an audio file and returns the thread path', async () => {
    const storage = new MemoryStorage();
    const useCase = createUseCase(storage);

    const image = await useCase.execute(coach, fileInput('photo.jpg', 'image/jpeg', Buffer.from('img')));
    const pdf = await useCase.execute(coach, fileInput('note.pdf', 'application/pdf', Buffer.from('pdf')));
    const audio = await useCase.execute(coach, fileInput('voice.mp3', 'audio/mpeg', Buffer.from('mp3')));

    expect(image.kind).toBe('IMAGE');
    expect(pdf.kind).toBe('PDF');
    expect(audio.kind).toBe('AUDIO');
    for (const uploaded of [image, pdf, audio]) {
      expect(uploaded.storagePath.startsWith(`chat/${THREAD}/`)).toBe(true);
      expect(storage.objects.get(uploaded.storagePath)?.length).toBe(uploaded.sizeBytes);
    }
  });

  it('rejects a file larger than 1MB before writing storage', async () => {
    const storage = new MemoryStorage();
    const useCase = createUseCase(storage);

    await expect(
      useCase.execute(coach, fileInput('big.jpg', 'image/jpeg', Buffer.alloc(FILE_MAX_SIZE_BYTES + 1, 1))),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.objects.size).toBe(0);
  });

  it('rejects an unsupported mime type before writing storage', async () => {
    const storage = new MemoryStorage();
    const useCase = createUseCase(storage);

    await expect(useCase.execute(coach, fileInput('note.txt', 'text/plain', Buffer.from('hi')))).rejects.toThrow(
      'Unsupported file mime type',
    );
    expect(storage.objects.size).toBe(0);
  });

  it('rejects a caller outside the thread before writing storage', async () => {
    const storage = new MemoryStorage();
    const access = {
      assertAccess: jest.fn().mockRejectedValue(new ForbiddenException('Chat thread access denied')),
    };
    const useCase = new UploadChatFileUseCase(access as unknown as ChatThreadAccessService, new FileUploadPolicy(), storage);

    await expect(useCase.execute(coach, fileInput('photo.jpg', 'image/jpeg', Buffer.from('img')))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(storage.objects.size).toBe(0);
  });

  it('does not return a path when the stored bytes cannot be read back', async () => {
    const storage = new MemoryStorage();
    storage.dropOnDownload = true;
    const useCase = createUseCase(storage);

    await expect(useCase.execute(coach, fileInput('photo.jpg', 'image/jpeg', Buffer.from('img')))).rejects.toThrow(
      'Uploaded file could not be verified',
    );
    expect(storage.objects.size).toBe(0);
  });
});

class MemoryStorage implements PrivateFileStoragePort {
  objects = new Map<string, Buffer>();
  dropOnDownload = false;

  async upload(input: { data: Buffer; path: string }): Promise<{ path: string }> {
    this.objects.set(input.path, Buffer.from(input.data));
    return { path: input.path };
  }

  async download(path: string) {
    if (this.dropOnDownload) {
      return null;
    }
    const data = this.objects.get(path);
    return data ? { contentType: 'application/octet-stream', data } : null;
  }

  async delete(path: string): Promise<void> {
    this.objects.delete(path);
  }
}

function createUseCase(storage: MemoryStorage): UploadChatFileUseCase {
  const access = {
    assertAccess: jest.fn().mockResolvedValue({ senderRole: 'COACH', threadId: THREAD }),
  };
  return new UploadChatFileUseCase(access as unknown as ChatThreadAccessService, new FileUploadPolicy(), storage);
}

function fileInput(fileName: string, mimeType: string, buffer: Buffer) {
  return { buffer, fileName, mimeType, threadId: THREAD };
}
