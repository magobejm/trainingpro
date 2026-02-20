import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '../../../files/domain/file-storage.port';
import {
  CHAT_TTL_REPOSITORY,
  type ChatTtlRepositoryPort,
} from '../../domain/chat-ttl.repository.port';

const PURGE_BATCH_SIZE = 200;

@Injectable()
export class PurgeExpiredChatDataUseCase {
  constructor(
    @Inject(CHAT_TTL_REPOSITORY)
    private readonly repository: ChatTtlRepositoryPort,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
  ) {}

  async execute(now = new Date()) {
    const attachments = await this.repository.findExpiredAttachments(now, PURGE_BATCH_SIZE);
    await this.deleteStorageObjects(attachments.map((item) => item.storagePath));
    const attachmentRowsDeleted = await this.repository.deleteAttachments(
      attachments.map((item) => item.id),
    );
    const messageRowsDeleted = await this.repository.deleteExpiredMessages(now);
    return {
      attachmentRowsDeleted,
      messageRowsDeleted,
      storageObjectsDeleted: attachments.length,
    };
  }

  private async deleteStorageObjects(paths: string[]) {
    for (const path of paths) {
      await this.safeDelete(path);
    }
  }

  private async safeDelete(path: string): Promise<void> {
    try {
      await this.fileStorage.delete(path);
    } catch {
      return;
    }
  }
}
