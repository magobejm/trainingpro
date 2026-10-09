import { decideReceiptOutcome, decideTicketOutcome, type DeliveryStatus } from '../domain/delivery-outcome';
import type {
  ClaimedDelivery,
  DispatchSummary,
  NotificationDispatchStore,
  ReceiptDue,
} from '../domain/notification-dispatch.store';
import { buildPushMessage } from '../domain/notification-messages';
import type { PushReceipt, PushTicket, PushTransport } from '../domain/push-transport.port';

const RECEIPT_DELAY_MS = 15 * 60_000;

export async function deliverClaimed(
  store: NotificationDispatchStore,
  transport: PushTransport,
  claimed: ClaimedDelivery[],
  now: Date,
  summary: DispatchSummary,
): Promise<void> {
  if (claimed.length === 0) {
    return;
  }
  const tickets = await sendOrNetwork(transport, claimed);
  for (let index = 0; index < claimed.length; index += 1) {
    const claimedRow = claimed[index];
    const ticket = tickets[index];
    if (claimedRow && ticket) {
      await settleOne(store, claimedRow, ticket, now, summary);
    }
  }
}

export async function confirmReceipts(
  store: NotificationDispatchStore,
  transport: PushTransport,
  now: Date,
  summary: DispatchSummary,
): Promise<void> {
  const before = new Date(now.getTime() - RECEIPT_DELAY_MS);
  const due = await store.listReceiptsDue(before, 100);
  if (due.length === 0) {
    return;
  }
  const receipts = await readReceipts(transport, due);
  if (!receipts) {
    return;
  }
  for (const row of due) {
    await applyReceipt(store, row, receipts[row.ticketId], now, summary);
  }
}

async function sendOrNetwork(transport: PushTransport, claimed: ClaimedDelivery[]): Promise<PushTicket[]> {
  const messages = claimed.map((row) =>
    buildPushMessage({
      clientId: row.clientId,
      eventId: row.eventId,
      payload: row.payload,
      recipientUserId: row.recipientUserId,
      token: row.token,
      topic: row.topic,
    }),
  );
  try {
    const tickets = await transport.send(messages);
    return messages.map((_, index) => tickets[index] ?? networkTicket('missing-ticket'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network';
    return messages.map(() => networkTicket(message));
  }
}

async function settleOne(
  store: NotificationDispatchStore,
  claimed: ClaimedDelivery,
  ticket: PushTicket,
  now: Date,
  summary: DispatchSummary,
): Promise<void> {
  const attempts = claimed.attempts + 1;
  const decision = decideTicketOutcome(ticket, attempts, now);
  await store.settleDelivery({ attempts, decision, deliveryId: claimed.deliveryId, now });
  if (decision.deactivateToken) {
    await store.deactivateToken(claimed.deviceTokenId);
  }
  countDecision(summary, decision.status);
}

async function readReceipts(transport: PushTransport, due: ReceiptDue[]): Promise<Record<string, PushReceipt> | null> {
  try {
    return await transport.getReceipts(due.map((row) => row.ticketId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'receipts failed';
    console.error(`[notifications] receipt check failed: ${message}`);
    return null;
  }
}

async function applyReceipt(
  store: NotificationDispatchStore,
  row: ReceiptDue,
  receipt: PushReceipt | undefined,
  now: Date,
  summary: DispatchSummary,
): Promise<void> {
  const outcome = decideReceiptOutcome(receipt);
  if (outcome === 'pending') {
    return;
  }
  await store.markReceipt({
    deliveryId: row.deliveryId,
    lastError: outcome.lastError,
    markInvalid: outcome.deactivateToken,
    now,
  });
  if (outcome.deactivateToken) {
    await store.deactivateToken(row.deviceTokenId);
    summary.invalidated += 1;
  }
}

function countDecision(summary: DispatchSummary, status: DeliveryStatus): void {
  if (status === 'SENT') {
    summary.sent += 1;
    return;
  }
  if (status === 'PENDING') {
    summary.retried += 1;
    return;
  }
  if (status === 'FAILED') {
    summary.failed += 1;
    return;
  }
  summary.invalidated += 1;
}

function networkTicket(message: string): PushTicket {
  return { code: 'NETWORK', message, status: 'error' };
}
