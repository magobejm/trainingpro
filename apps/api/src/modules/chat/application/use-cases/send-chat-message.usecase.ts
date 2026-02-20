import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  CHAT_REPOSITORY,
  type ChatRepositoryPort,
  type SendChatMessageInput,
} from '../../domain/chat.repository.port';
import { ChatMessagePolicy } from '../../domain/policies/chat-message.policy';

@Injectable()
export class SendChatMessageUseCase {
  constructor(
    private readonly messagePolicy: ChatMessagePolicy,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
  ) {}

  execute(context: AuthContext, input: SendChatMessageInput) {
    this.messagePolicy.ensureMessagePayload(input);
    return this.chatRepository.sendMessage(context, input);
  }
}
