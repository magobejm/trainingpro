import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from '../../domain/notifications.repository.port';

@Injectable()
export class EmitSessionCompletedEventUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
  ) {}

  execute(sessionId: string): Promise<void> {
    return this.repository.emitSessionCompletedEvent(sessionId);
  }
}
