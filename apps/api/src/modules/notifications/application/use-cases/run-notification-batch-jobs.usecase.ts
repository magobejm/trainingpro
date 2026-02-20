import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from '../../domain/notifications.repository.port';

@Injectable()
export class RunNotificationBatchJobsUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
  ) {}

  execute(now = new Date()) {
    return this.repository.runBatchJobs(now);
  }
}
