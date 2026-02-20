import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  CHAT_REPOSITORY,
  type ChatRepositoryPort,
  type ResolveChatThreadInput,
} from '../../domain/chat.repository.port';

@Injectable()
export class ResolveChatThreadUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
  ) {}

  execute(context: AuthContext, input: ResolveChatThreadInput) {
    return this.chatRepository.resolveThread(context, input);
  }
}
