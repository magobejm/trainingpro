import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../../files/domain/private-file-storage.port';
import { CHAT_REPOSITORY, type ChatRepositoryPort, type SendChatMessageInput } from '../../domain/chat.repository.port';
import { ChatMessagePolicy } from '../../domain/policies/chat-message.policy';

@Injectable()
export class SendChatMessageUseCase {
  constructor(
    private readonly messagePolicy: ChatMessagePolicy,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
    @Inject(PRIVATE_FILE_STORAGE)
    private readonly storage: PrivateFileStoragePort,
  ) {}

  async execute(context: AuthContext, input: SendChatMessageInput) {
    this.messagePolicy.ensureMessagePayload(input);
    await this.ensureStoredAttachments(input);
    return this.chatRepository.sendMessage(context, input);
  }

  private async ensureStoredAttachments(input: SendChatMessageInput): Promise<void> {
    for (const attachment of input.attachments ?? []) {
      const stored = await this.storage.download(attachment.storagePath);
      if (!stored || stored.data.length !== attachment.sizeBytes) {
        throw new BadRequestException('Attachment file is missing from storage');
      }
    }
  }
}
