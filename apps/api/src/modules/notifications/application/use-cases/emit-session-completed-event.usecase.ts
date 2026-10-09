import { Inject, Injectable } from '@nestjs/common';
import { dispatchNotificationsQuietly } from '../dispatch-notifications-quietly';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepositoryPort } from '../../domain/notifications.repository.port';
import { DispatchNotificationsUseCase } from './dispatch-notifications.usecase';

@Injectable()
export class EmitSessionCompletedEventUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
    private readonly dispatch: DispatchNotificationsUseCase,
  ) {}

  async execute(sessionId: string): Promise<void> {
    await this.repository.emitSessionCompletedEvent(sessionId);
    await dispatchNotificationsQuietly(this.dispatch);
  }
}
