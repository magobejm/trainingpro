import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PurgeExpiredChatDataUseCase } from './application/use-cases/purge-expired-chat-data.usecase';
import { CHAT_TTL_REPOSITORY } from './domain/chat-ttl.repository.port';
import { ChatTtlRepositoryPrisma } from './infra/prisma/chat-ttl.repository.prisma';
import { MaintenanceController } from './presentation/controllers/maintenance.controller';
import { CronSecretGuard } from './presentation/guards/cron-secret.guard';

@Module({
  imports: [FilesModule, NotificationsModule],
  controllers: [MaintenanceController],
  providers: [
    CronSecretGuard,
    PurgeExpiredChatDataUseCase,
    ChatTtlRepositoryPrisma,
    {
      provide: CHAT_TTL_REPOSITORY,
      useExisting: ChatTtlRepositoryPrisma,
    },
  ],
})
export class MaintenanceModule {}
