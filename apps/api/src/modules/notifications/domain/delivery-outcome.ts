export const MAX_DELIVERY_ATTEMPTS = 5;

const RETRY_MINUTES = [1, 5, 15, 60];
const PERMANENT_CODES = new Set(['InvalidCredentials', 'MessageTooBig', 'MismatchSenderId']);
const RETRYABLE_CODES = new Set(['ExpoError', 'HTTP_5XX', 'MessageRateExceeded', 'NETWORK', 'ProviderError']);

export type PushTicketResult = { id: string; status: 'ok' } | { code: string; message: string; status: 'error' };

export type DeliveryStatus = 'FAILED' | 'INVALID_TOKEN' | 'PENDING' | 'SENT';

export type DeliveryDecision = {
  deactivateToken: boolean;
  lastError: string | null;
  nextAttemptAt: Date;
  status: DeliveryStatus;
  ticketId: string | null;
};

export function decideTicketOutcome(ticket: PushTicketResult, attempts: number, now: Date): DeliveryDecision {
  if (ticket.status === 'ok') {
    return {
      deactivateToken: false,
      lastError: null,
      nextAttemptAt: now,
      status: 'SENT',
      ticketId: ticket.id,
    };
  }
  return decideError(ticket.code, ticket.message, attempts, now);
}

export function decideReceiptOutcome(
  receipt: PushTicketResult | { code: string; message: string; status: 'error' } | { status: 'ok' } | undefined,
): 'pending' | { deactivateToken: boolean; lastError: string | null } {
  if (!receipt) {
    return 'pending';
  }
  if (receipt.status === 'ok') {
    return { deactivateToken: false, lastError: null };
  }
  if (receipt.code === 'DeviceNotRegistered') {
    return { deactivateToken: true, lastError: trimDeliveryError(receipt.message || receipt.code) };
  }
  return { deactivateToken: false, lastError: trimDeliveryError(receipt.message || receipt.code) };
}

export function trimDeliveryError(value: string): string {
  return value.slice(0, 300);
}

function decideError(code: string, message: string, attempts: number, now: Date): DeliveryDecision {
  const lastError = trimDeliveryError(message || code);
  if (code === 'DeviceNotRegistered' || code === 'InvalidToken') {
    return { deactivateToken: true, lastError, nextAttemptAt: now, status: 'INVALID_TOKEN', ticketId: null };
  }
  if (PERMANENT_CODES.has(code) || !isRetryable(code) || attempts >= MAX_DELIVERY_ATTEMPTS) {
    return { deactivateToken: false, lastError, nextAttemptAt: now, status: 'FAILED', ticketId: null };
  }
  const minutes = RETRY_MINUTES[Math.min(attempts, RETRY_MINUTES.length) - 1] ?? 60;
  return {
    deactivateToken: false,
    lastError,
    nextAttemptAt: new Date(now.getTime() + minutes * 60_000),
    status: 'PENDING',
    ticketId: null,
  };
}

function isRetryable(code: string): boolean {
  return RETRYABLE_CODES.has(code) || code.startsWith('5');
}
