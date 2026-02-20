import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationTopic,
  type NotificationsRepositoryPort,
} from '../../domain/notifications.repository.port';

@Injectable()
export class SetNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
  ) {}

  execute(context: AuthContext, topic: NotificationTopic, enabled: boolean) {
    return this.repository.setPreferenceForCoach(context, topic, enabled);
  }
}
