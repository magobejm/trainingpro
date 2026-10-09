import { DispatchNotificationsUseCase } from '../../src/modules/notifications/application/use-cases/dispatch-notifications.usecase';
import type {
  ClaimedDelivery,
  NotificationDispatchStore,
} from '../../src/modules/notifications/domain/notification-dispatch.store';
import type { PushTicket, PushTransport } from '../../src/modules/notifications/domain/push-transport.port';

const delivery: ClaimedDelivery = {
  attempts: 0,
  deliveryId: 'delivery-1',
  deviceTokenId: 'token-1',
  eventId: 'event-1',
  payload: { sessionId: 'session-1' },
  token: 'ExponentPushToken[abc]',
  topic: 'SESSION_COMPLETED',
};

class MemoryStore implements NotificationDispatchStore {
  attempts = 0;
  deactivated: string[] = [];
  exposeReceipt = false;
  queued = true;
  receiptChecked = false;
  status: 'FAILED' | 'INVALID_TOKEN' | 'PENDING' | 'SENT' = 'PENDING';

  claimDueDeliveries(): Promise<ClaimedDelivery[]> {
    if (!this.queued || this.status !== 'PENDING') {
      return Promise.resolve([]);
    }
    this.queued = false;
    return Promise.resolve([{ ...delivery, attempts: this.attempts }]);
  }

  deactivateToken(deviceTokenId: string): Promise<void> {
    this.deactivated.push(deviceTokenId);
    return Promise.resolve();
  }

  fanOut(): Promise<number> {
    return Promise.resolve(0);
  }

  listReceiptsDue(): Promise<Array<{ deliveryId: string; deviceTokenId: string; ticketId: string }>> {
    if (!this.exposeReceipt || this.status !== 'SENT' || this.receiptChecked) {
      return Promise.resolve([]);
    }
    return Promise.resolve([
      { deliveryId: delivery.deliveryId, deviceTokenId: delivery.deviceTokenId, ticketId: 'ticket-1' },
    ]);
  }

  markReceipt(): Promise<void> {
    this.receiptChecked = true;
    return Promise.resolve();
  }

  settleDelivery(input: {
    attempts: number;
    decision: { status: 'FAILED' | 'INVALID_TOKEN' | 'PENDING' | 'SENT' };
  }): Promise<void> {
    this.attempts = input.attempts;
    this.status = input.decision.status;
    this.queued = input.decision.status === 'PENDING';
    return Promise.resolve();
  }
}

class ScriptedTransport implements PushTransport {
  readonly sent: string[][] = [];

  constructor(private readonly tickets: PushTicket[]) {}

  getReceipts(): Promise<Record<string, { code: string; message: string; status: 'error' }>> {
    return Promise.resolve({
      'ticket-1': { code: 'DeviceNotRegistered', message: 'gone', status: 'error' },
    });
  }

  send(messages: Array<{ to: string }>): Promise<PushTicket[]> {
    this.sent.push(messages.map((message) => message.to));
    const ticket = this.tickets[this.sent.length - 1] ?? this.tickets[this.tickets.length - 1];
    if (!ticket) {
      return Promise.resolve([]);
    }
    return Promise.resolve(messages.map(() => ticket));
  }
}

describe('DispatchNotificationsUseCase', () => {
  const now = new Date('2026-10-09T10:00:00.000Z');

  it('sends a claimed delivery once when the job runs twice', async () => {
    const store = new MemoryStore();
    const transport = new ScriptedTransport([{ id: 'ticket-1', status: 'ok' }]);
    const useCase = new DispatchNotificationsUseCase(store, transport);
    const first = await useCase.execute(now);
    const second = await useCase.execute(now);
    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    expect(transport.sent).toEqual([[delivery.token]]);
  });

  it('deactivates the token when Expo says the device is not registered', async () => {
    const store = new MemoryStore();
    const transport = new ScriptedTransport([{ code: 'DeviceNotRegistered', message: 'gone', status: 'error' }]);
    const useCase = new DispatchNotificationsUseCase(store, transport);
    const summary = await useCase.execute(now);
    expect(summary.invalidated).toBe(1);
    expect(store.deactivated).toEqual(['token-1']);
    expect(store.status).toBe('INVALID_TOKEN');
  });

  it('retries a transient error and fails after five attempts', async () => {
    const store = new MemoryStore();
    const transport = new ScriptedTransport([{ code: 'MessageRateExceeded', message: 'slow', status: 'error' }]);
    const useCase = new DispatchNotificationsUseCase(store, transport);
    const summaries = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      summaries.push(await useCase.execute(new Date(now.getTime() + attempt * 60_000)));
    }
    expect(transport.sent).toHaveLength(5);
    expect(summaries[4]?.failed).toBe(1);
    expect(store.status).toBe('FAILED');
    expect(summaries[5]?.sent).toBe(0);
  });

  it('deactivates the token when a later receipt says the device is gone', async () => {
    const store = new MemoryStore();
    store.exposeReceipt = true;
    store.status = 'SENT';
    store.queued = false;
    const transport = new ScriptedTransport([{ id: 'ticket-1', status: 'ok' }]);
    const useCase = new DispatchNotificationsUseCase(store, transport);
    const summary = await useCase.execute(new Date(now.getTime() + 16 * 60_000));
    expect(summary.invalidated).toBe(1);
    expect(store.deactivated).toEqual(['token-1']);
    expect(transport.sent).toEqual([]);
  });
});
