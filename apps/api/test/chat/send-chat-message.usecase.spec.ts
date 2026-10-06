import { BadRequestException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { SendChatMessageUseCase } from '../../src/modules/chat/application/use-cases/send-chat-message.usecase';
import type { ChatRepositoryPort, SendChatMessageInput } from '../../src/modules/chat/domain/chat.repository.port';
import { ChatMessagePolicy } from '../../src/modules/chat/domain/policies/chat-message.policy';
import type { PrivateFileStoragePort } from '../../src/modules/files/domain/private-file-storage.port';

const THREAD = '11111111-1111-4111-8111-111111111111';

const coach: AuthContext = {
  activeRole: 'coach',
  email: 'coach@fitcoach.local',
  roles: ['coach'],
  subject: 'coach-1',
};

describe('SendChatMessageUseCase', () => {
  it('does not create a message when the attachment was never uploaded', async () => {
    const storage = new MemoryStorage();
    const repository = createRepository();
    const useCase = createUseCase(repository, storage);

    await expect(useCase.execute(coach, message(Buffer.from('img').length))).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.sendMessage).not.toHaveBeenCalled();
  });

  it('does not create a message when the stored size differs', async () => {
    const storage = new MemoryStorage();
    const path = `chat/${THREAD}/photo.jpg`;
    storage.objects.set(path, Buffer.from('x'));
    const repository = createRepository();
    const useCase = createUseCase(repository, storage);

    await expect(useCase.execute(coach, message(3))).rejects.toThrow('Attachment file is missing from storage');
    expect(repository.sendMessage).not.toHaveBeenCalled();
  });

  it('creates the message after the stored bytes match', async () => {
    const bytes = Buffer.from('img');
    const storage = new MemoryStorage();
    storage.objects.set(`chat/${THREAD}/photo.jpg`, bytes);
    const repository = createRepository();
    const useCase = createUseCase(repository, storage);

    await useCase.execute(coach, message(bytes.length));

    expect(repository.sendMessage).toHaveBeenCalledTimes(1);
  });
});

class MemoryStorage implements PrivateFileStoragePort {
  objects = new Map<string, Buffer>();

  async upload(): Promise<{ path: string }> {
    return { path: '' };
  }

  async download(path: string) {
    const data = this.objects.get(path);
    return data ? { contentType: 'image/jpeg', data } : null;
  }

  async delete(): Promise<void> {
    return undefined;
  }
}

function createRepository(): ChatRepositoryPort {
  return {
    listMessagesByThread: jest.fn(),
    resolveThread: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue({ id: 'message-1' }),
  };
}

function createUseCase(repository: ChatRepositoryPort, storage: PrivateFileStoragePort): SendChatMessageUseCase {
  return new SendChatMessageUseCase(new ChatMessagePolicy(), repository, storage);
}

function message(sizeBytes: number): SendChatMessageInput {
  return {
    attachments: [
      {
        fileName: 'photo.jpg',
        kind: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeBytes,
        storagePath: `chat/${THREAD}/photo.jpg`,
      },
    ],
    text: 'hola',
    threadId: THREAD,
  };
}
