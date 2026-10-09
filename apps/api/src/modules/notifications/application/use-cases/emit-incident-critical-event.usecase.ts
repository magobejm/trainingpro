import { Inject, Injectable } from '@nestjs/common';
import { dispatchNotificationsQuietly } from '../dispatch-notifications-quietly';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepositoryPort } from '../../domain/notifications.repository.port';
import { DispatchNotificationsUseCase } from './dispatch-notifications.usecase';

@Injectable()
export class EmitIncidentCriticalEventUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
    private readonly dispatch: DispatchNotificationsUseCase,
  ) {}

  async execute(incidentId: string): Promise<void> {
    await this.repository.emitIncidentCriticalEvent(incidentId);
    await dispatchNotificationsQuietly(this.dispatch);
  }
}
