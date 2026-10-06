import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FileUploadPolicy } from '../files/domain/policies/file-upload.policy';
import { FilesModule } from '../files/files.module';
import { CreateUploadPolicyUseCase } from './application/use-cases/create-upload-policy.usecase';
import { ListChatMessagesUseCase } from './application/use-cases/list-chat-messages.usecase';
import { ResolveChatThreadUseCase } from './application/use-cases/resolve-chat-thread.usecase';
import { SendChatMessageUseCase } from './application/use-cases/send-chat-message.usecase';
import { CHAT_REPOSITORY } from './domain/chat.repository.port';
import { ChatMessagePolicy } from './domain/policies/chat-message.policy';
import { ChatRepositoryPrisma } from './infra/prisma/chat.repository.prisma';
import { ChatThreadAccessService } from './infra/prisma/chat-thread-access.service';
import { ChatUploadPolicyController } from './presentation/controllers/chat-upload-policy.controller';
import { ChatController } from './presentation/controllers/chat.controller';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [ChatController, ChatUploadPolicyController],
  providers: [
    ChatMessagePolicy,
    ChatThreadAccessService,
    CreateUploadPolicyUseCase,
    FileUploadPolicy,
    ListChatMessagesUseCase,
    ResolveChatThreadUseCase,
    SendChatMessageUseCase,
    ChatRepositoryPrisma,
    {
      provide: CHAT_REPOSITORY,
      useExisting: ChatRepositoryPrisma,
    },
  ],
  exports: [CHAT_REPOSITORY, ResolveChatThreadUseCase, SendChatMessageUseCase],
})
export class ChatModule {}
