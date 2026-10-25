import { Controller, Post, UseGuards } from '@nestjs/common';
import { DispatchNotificationsUseCase } from '../../../notifications/application/use-cases/dispatch-notifications.usecase';
import { RunNotificationBatchJobsUseCase } from '../../../notifications/application/use-cases/run-notification-batch-jobs.usecase';
import { IntegrationsService } from '../../../integrations/integrations.service';
import { PurgeExpiredChatDataUseCase } from '../../application/use-cases/purge-expired-chat-data.usecase';
import { CronSecretGuard } from '../guards/cron-secret.guard';

@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly dispatchNotificationsUseCase: DispatchNotificationsUseCase,
    private readonly purgeExpiredChatDataUseCase: PurgeExpiredChatDataUseCase,
    private readonly integrations: IntegrationsService,
    private readonly runNotificationBatchJobsUseCase: RunNotificationBatchJobsUseCase,
  ) {}

  @Post('dispatch')
  @UseGuards(CronSecretGuard)
  async dispatch() {
    const chatPurge = await this.purgeExpiredChatDataUseCase.execute();
    const notificationJobs = await this.runNotificationBatchJobsUseCase.execute();
    const notificationDelivery = await this.dispatchNotificationsUseCase.execute();
    const integrations = await this.integrations.processEvents();
    return { chatPurge, integrations, notificationDelivery, notificationJobs, status: 'accepted' };
  }
}
