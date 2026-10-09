import { Inject, Injectable } from '@nestjs/common';
import { confirmReceipts, deliverClaimed } from '../dispatch-notifications.steps';
import {
  emptyDispatchSummary,
  NOTIFICATION_DISPATCH_STORE,
  type DispatchSummary,
  type NotificationDispatchStore,
} from '../../domain/notification-dispatch.store';
import { PUSH_TRANSPORT, type PushTransport } from '../../domain/push-transport.port';

@Injectable()
export class DispatchNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_DISPATCH_STORE)
    private readonly store: NotificationDispatchStore,
    @Inject(PUSH_TRANSPORT)
    private readonly transport: PushTransport,
  ) {}

  async execute(now = new Date()): Promise<DispatchSummary> {
    const summary = emptyDispatchSummary();
    summary.fannedOut = await this.store.fanOut(now);
    const claimed = await this.store.claimDueDeliveries(now, 100);
    await deliverClaimed(this.store, this.transport, claimed, now, summary);
    await confirmReceipts(this.store, this.transport, now, summary);
    return summary;
  }
}
