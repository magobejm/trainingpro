import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from '../../domain/notifications.repository.port';

@Injectable()
export class EmitIncidentCriticalEventUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
  ) {}

  execute(incidentId: string): Promise<void> {
    return this.repository.emitIncidentCriticalEvent(incidentId);
  }
}
