import type { PushMessage } from './notification-messages';

export const PUSH_TRANSPORT = Symbol('PUSH_TRANSPORT');

export type PushTicket = { id: string; status: 'ok' } | { code: string; message: string; status: 'error' };

export type PushReceipt = { code: string; message: string; status: 'error' } | { status: 'ok' };

export interface PushTransport {
  getReceipts(ticketIds: string[]): Promise<Record<string, PushReceipt>>;
  send(messages: PushMessage[]): Promise<PushTicket[]>;
}
