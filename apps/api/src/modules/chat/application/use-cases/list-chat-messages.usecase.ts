import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  CHAT_REPOSITORY,
  type ChatRepositoryPort,
} from '../../domain/chat.repository.port';

@Injectable()
export class ListChatMessagesUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
  ) {}

  execute(context: AuthContext, threadId: string) {
    return this.chatRepository.listMessagesByThread(context, threadId);
  }
}
