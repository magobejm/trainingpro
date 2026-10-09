import { Injectable } from '@nestjs/common';
import type { Expo, ExpoPushMessage } from 'expo-server-sdk';
import type { PushMessage } from '../../domain/notification-messages';
import type { PushReceipt, PushTicket, PushTransport } from '../../domain/push-transport.port';
import { mapExpoReceipt, mapExpoTicket } from './map-expo-ticket';

type ExpoClient = {
  Expo: typeof Expo;
  client: Expo;
};

type IndexedMessage = { index: number; message: ExpoPushMessage };

@Injectable()
export class ExpoPushTransport implements PushTransport {
  private ready: Promise<ExpoClient> | null = null;

  async getReceipts(ticketIds: string[]): Promise<Record<string, PushReceipt>> {
    const { client } = await this.load();
    const result: Record<string, PushReceipt> = {};
    const chunks = client.chunkPushNotificationReceiptIds(ticketIds);
    for (const chunk of chunks) {
      const receipts = await client.getPushNotificationReceiptsAsync(chunk);
      Object.entries(receipts).forEach(([id, receipt]) => {
        result[id] = mapExpoReceipt(receipt);
      });
    }
    return result;
  }

  async send(messages: PushMessage[]): Promise<PushTicket[]> {
    const loaded = await this.load();
    const tickets = messages.map(() => invalidTokenTicket());
    const valid = messages.flatMap((message, index) =>
      loaded.Expo.isExpoPushToken(message.to) ? [{ index, message: toExpoMessage(message) }] : [],
    );
    await this.fillValidTickets(loaded.client, valid, tickets);
    return tickets;
  }

  private load(): Promise<ExpoClient> {
    if (!this.ready) {
      this.ready = import('expo-server-sdk').then((mod) => {
        const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
        const client = accessToken ? new mod.Expo({ accessToken }) : new mod.Expo();
        return { Expo: mod.Expo, client };
      });
    }
    return this.ready;
  }

  private async fillValidTickets(client: Expo, valid: IndexedMessage[], tickets: PushTicket[]): Promise<void> {
    const chunks = client.chunkPushNotifications(valid.map((item) => item.message));
    let cursor = 0;
    for (const chunk of chunks) {
      const chunkTickets = await this.sendChunk(client, chunk);
      this.assignChunk(valid, tickets, chunkTickets, cursor);
      cursor += chunk.length;
    }
  }

  private assignChunk(valid: IndexedMessage[], tickets: PushTicket[], chunkTickets: PushTicket[], cursor: number): void {
    chunkTickets.forEach((ticket, offset) => {
      const target = valid[cursor + offset];
      if (target) {
        tickets[target.index] = ticket;
      }
    });
  }

  private async sendChunk(client: Expo, chunk: ExpoPushMessage[]): Promise<PushTicket[]> {
    try {
      const tickets = await client.sendPushNotificationsAsync(chunk);
      return tickets.map((ticket) => mapExpoTicket(ticket));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'network';
      return chunk.map(() => ({ code: 'NETWORK', message, status: 'error' as const }));
    }
  }
}

function toExpoMessage(message: PushMessage): ExpoPushMessage {
  return {
    body: message.body,
    channelId: message.channelId,
    data: message.data,
    title: message.title,
    to: message.to,
  };
}

function invalidTokenTicket(): PushTicket {
  return { code: 'InvalidToken', message: 'Invalid Expo push token', status: 'error' };
}
