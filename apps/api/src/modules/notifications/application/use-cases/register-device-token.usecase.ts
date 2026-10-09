import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
  type RegisterDeviceTokenInput,
} from '../../domain/notifications.repository.port';

@Injectable()
export class RegisterDeviceTokenUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepositoryPort,
  ) {}

  async execute(context: AuthContext, input: RegisterDeviceTokenInput): Promise<{ status: 'ok' }> {
    await this.repository.registerDeviceToken(context, input);
    return { status: 'ok' };
  }
}
