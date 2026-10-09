import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeactivateDeviceTokenUseCase } from './application/use-cases/deactivate-device-token.usecase';
import { DispatchNotificationsUseCase } from './application/use-cases/dispatch-notifications.usecase';
import { EmitIncidentCriticalEventUseCase } from './application/use-cases/emit-incident-critical-event.usecase';
import { EmitSessionCompletedEventUseCase } from './application/use-cases/emit-session-completed-event.usecase';
import { GetNotificationPreferencesUseCase } from './application/use-cases/get-notification-preferences.usecase';
import { RegisterDeviceTokenUseCase } from './application/use-cases/register-device-token.usecase';
import { RunNotificationBatchJobsUseCase } from './application/use-cases/run-notification-batch-jobs.usecase';
import { SetNotificationPreferenceUseCase } from './application/use-cases/set-notification-preference.usecase';
import { NOTIFICATION_DISPATCH_STORE } from './domain/notification-dispatch.store';
import { NOTIFICATIONS_REPOSITORY } from './domain/notifications.repository.port';
import { PUSH_TRANSPORT } from './domain/push-transport.port';
import { ExpoPushTransport } from './infra/expo/expo-push.transport';
import { NotificationDispatchRepositoryPrisma } from './infra/prisma/notification-dispatch.repository';
import { NotificationsRepositoryPrisma } from './infra/prisma/notifications.repository.prisma';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    DeactivateDeviceTokenUseCase,
    DispatchNotificationsUseCase,
    EmitIncidentCriticalEventUseCase,
    EmitSessionCompletedEventUseCase,
    ExpoPushTransport,
    GetNotificationPreferencesUseCase,
    NotificationDispatchRepositoryPrisma,
    RegisterDeviceTokenUseCase,
    RunNotificationBatchJobsUseCase,
    SetNotificationPreferenceUseCase,
    NotificationsRepositoryPrisma,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useExisting: NotificationsRepositoryPrisma,
    },
    {
      provide: NOTIFICATION_DISPATCH_STORE,
      useExisting: NotificationDispatchRepositoryPrisma,
    },
    {
      provide: PUSH_TRANSPORT,
      useExisting: ExpoPushTransport,
    },
  ],
  exports: [
    DispatchNotificationsUseCase,
    EmitIncidentCriticalEventUseCase,
    EmitSessionCompletedEventUseCase,
    RunNotificationBatchJobsUseCase,
  ],
})
export class NotificationsModule {}
