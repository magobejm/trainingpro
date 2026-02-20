import { Controller, Post, UseGuards } from '@nestjs/common';
import { RunNotificationBatchJobsUseCase } from '../../../notifications/application/use-cases/run-notification-batch-jobs.usecase';
import { PurgeExpiredChatDataUseCase } from '../../application/use-cases/purge-expired-chat-data.usecase';
import { CronSecretGuard } from '../guards/cron-secret.guard';

@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly purgeExpiredChatDataUseCase: PurgeExpiredChatDataUseCase,
    private readonly runNotificationBatchJobsUseCase: RunNotificationBatchJobsUseCase,
  ) {}

  @Post('dispatch')
  @UseGuards(CronSecretGuard)
  async dispatch() {
    const chatPurge = await this.purgeExpiredChatDataUseCase.execute();
    const notificationJobs = await this.runNotificationBatchJobsUseCase.execute();
    return { chatPurge, notificationJobs, status: 'accepted' };
  }
}
