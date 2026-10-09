import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepositoryPort } from '../../domain/notifications.repository.port';

@Injectable()
export class DeactivateDeviceTokenUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
  ) {}

  async execute(context: AuthContext, token: string): Promise<{ status: 'ok' }> {
    await this.repository.deactivateDeviceToken(context, token);
    return { status: 'ok' };
  }
}
