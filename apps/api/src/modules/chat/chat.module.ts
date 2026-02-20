import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListChatMessagesUseCase } from './application/use-cases/list-chat-messages.usecase';
import { ResolveChatThreadUseCase } from './application/use-cases/resolve-chat-thread.usecase';
import { SendChatMessageUseCase } from './application/use-cases/send-chat-message.usecase';
import { CHAT_REPOSITORY } from './domain/chat.repository.port';
import { ChatMessagePolicy } from './domain/policies/chat-message.policy';
import { ChatRepositoryPrisma } from './infra/prisma/chat.repository.prisma';
import { ChatController } from './presentation/controllers/chat.controller';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [
    ChatMessagePolicy,
    ListChatMessagesUseCase,
    ResolveChatThreadUseCase,
    SendChatMessageUseCase,
    ChatRepositoryPrisma,
    {
      provide: CHAT_REPOSITORY,
      useExisting: ChatRepositoryPrisma,
    },
  ],
  exports: [CHAT_REPOSITORY],
})
export class ChatModule {}
