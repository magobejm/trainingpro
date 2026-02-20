import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmitIncidentCriticalEventUseCase } from './application/use-cases/emit-incident-critical-event.usecase';
import { EmitSessionCompletedEventUseCase } from './application/use-cases/emit-session-completed-event.usecase';
import { GetNotificationPreferencesUseCase } from './application/use-cases/get-notification-preferences.usecase';
import { RegisterDeviceTokenUseCase } from './application/use-cases/register-device-token.usecase';
import { RunNotificationBatchJobsUseCase } from './application/use-cases/run-notification-batch-jobs.usecase';
import { SetNotificationPreferenceUseCase } from './application/use-cases/set-notification-preference.usecase';
import { NOTIFICATIONS_REPOSITORY } from './domain/notifications.repository.port';
import { NotificationsRepositoryPrisma } from './infra/prisma/notifications.repository.prisma';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    EmitIncidentCriticalEventUseCase,
    EmitSessionCompletedEventUseCase,
    GetNotificationPreferencesUseCase,
    RegisterDeviceTokenUseCase,
    RunNotificationBatchJobsUseCase,
    SetNotificationPreferenceUseCase,
    NotificationsRepositoryPrisma,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useExisting: NotificationsRepositoryPrisma,
    },
  ],
  exports: [
    EmitIncidentCriticalEventUseCase,
    EmitSessionCompletedEventUseCase,
    RunNotificationBatchJobsUseCase,
  ],
})
export class NotificationsModule {}
