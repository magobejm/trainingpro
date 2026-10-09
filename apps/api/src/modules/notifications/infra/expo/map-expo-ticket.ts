import type { ExpoPushReceipt, ExpoPushTicket } from 'expo-server-sdk';
import type { PushReceipt, PushTicket } from '../../domain/push-transport.port';

export function mapExpoTicket(ticket: ExpoPushTicket): PushTicket {
  if (ticket.status === 'ok') {
    return { id: ticket.id, status: 'ok' };
  }
  return {
    code: ticket.details?.error ?? 'ExpoError',
    message: ticket.message,
    status: 'error',
  };
}

export function mapExpoReceipt(receipt: ExpoPushReceipt): PushReceipt {
  if (receipt.status === 'ok') {
    return { status: 'ok' };
  }
  return {
    code: receipt.details?.error ?? 'ExpoError',
    message: receipt.message,
    status: 'error',
  };
}
