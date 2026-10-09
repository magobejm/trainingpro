import type { DeliveryDecision } from './delivery-outcome';

export const NOTIFICATION_DISPATCH_STORE = Symbol('NOTIFICATION_DISPATCH_STORE');

export type DispatchSummary = {
  failed: number;
  fannedOut: number;
  invalidated: number;
  retried: number;
  sent: number;
};

export type ClaimedDelivery = {
  attempts: number;
  clientId: string | null;
  deliveryId: string;
  deviceTokenId: string;
  eventId: string;
  payload: Record<string, unknown> | null;
  recipientUserId: string | null;
  token: string;
  topic: string;
};

export type ReceiptDue = {
  deliveryId: string;
  deviceTokenId: string;
  ticketId: string;
};

export type SettleDeliveryInput = {
  attempts: number;
  decision: DeliveryDecision;
  deliveryId: string;
  now: Date;
};

export type MarkReceiptInput = {
  deliveryId: string;
  lastError: string | null;
  markInvalid: boolean;
  now: Date;
};

export interface NotificationDispatchStore {
  claimDueDeliveries(now: Date, limit: number): Promise<ClaimedDelivery[]>;
  deactivateToken(deviceTokenId: string): Promise<void>;
  fanOut(now: Date): Promise<number>;
  listReceiptsDue(before: Date, limit: number): Promise<ReceiptDue[]>;
  markReceipt(input: MarkReceiptInput): Promise<void>;
  settleDelivery(input: SettleDeliveryInput): Promise<void>;
}

export function emptyDispatchSummary(): DispatchSummary {
  return { failed: 0, fannedOut: 0, invalidated: 0, retried: 0, sent: 0 };
}
