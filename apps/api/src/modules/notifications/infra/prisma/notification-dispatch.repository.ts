import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, type NotificationDeliveryStatus } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  ClaimedDelivery,
  MarkReceiptInput,
  NotificationDispatchStore,
  ReceiptDue,
  SettleDeliveryInput,
} from '../../domain/notification-dispatch.store';
import {
  planDeliveries,
  type RecipientEvent,
  type RecipientPreference,
  type RecipientToken,
} from '../../domain/notification-recipients';

const FAN_OUT_LIMIT = 50;
const STALE_SENDING_MS = 10 * 60_000;

@Injectable()
export class NotificationDispatchRepositoryPrisma implements NotificationDispatchStore {
  constructor(private readonly prisma: PrismaService) {}

  async claimDueDeliveries(now: Date, limit: number): Promise<ClaimedDelivery[]> {
    await this.reclaimStaleSending(now);
    const due = await this.prisma.notificationDelivery.findMany({
      include: {
        deviceToken: {
          include: {
            client: { select: { email: true } },
            membership: { select: { user: { select: { supabaseUid: true } } } },
          },
        },
        event: true,
      },
      orderBy: { nextAttemptAt: 'asc' },
      take: limit,
      where: { nextAttemptAt: { lte: now }, status: 'PENDING' },
    });
    const recipients = await loadRecipientUsers(this.prisma, due);
    const claimed: ClaimedDelivery[] = [];
    for (const row of due) {
      const updated = await this.prisma.notificationDelivery.updateMany({
        data: { status: 'SENDING' },
        where: { id: row.id, status: 'PENDING' },
      });
      if (updated.count === 1) {
        claimed.push(toClaimed(row, recipients.get(row.deviceTokenId) ?? null));
      }
    }
    return claimed;
  }

  async deactivateToken(deviceTokenId: string): Promise<void> {
    await this.prisma.notificationDeviceToken.updateMany({
      data: { isActive: false },
      where: { id: deviceTokenId },
    });
  }

  async fanOut(now: Date): Promise<number> {
    const events = await this.prisma.notificationEventLog.findMany({
      orderBy: { createdAt: 'asc' },
      take: FAN_OUT_LIMIT,
      where: { processedAt: null },
    });
    if (events.length === 0) {
      return 0;
    }
    const tokens = await this.loadTokens(events.map((event) => event.organizationId));
    const preferences = await this.loadPreferences(events);
    const planned = planDeliveries(events.map(toRecipientEvent), tokens, preferences);
    const count = await this.insertDeliveries(planned, now);
    await this.prisma.notificationEventLog.updateMany({
      data: { processedAt: now },
      where: { id: { in: events.map((event) => event.id) }, processedAt: null },
    });
    return count;
  }

  async listReceiptsDue(before: Date, limit: number): Promise<ReceiptDue[]> {
    const rows = await this.prisma.notificationDelivery.findMany({
      select: { deviceTokenId: true, expoTicketId: true, id: true },
      take: limit,
      where: {
        expoTicketId: { not: null },
        receiptCheckedAt: null,
        sentAt: { lte: before },
        status: 'SENT',
      },
    });
    return rows.flatMap((row) =>
      row.expoTicketId ? [{ deliveryId: row.id, deviceTokenId: row.deviceTokenId, ticketId: row.expoTicketId }] : [],
    );
  }

  async markReceipt(input: MarkReceiptInput): Promise<void> {
    await this.prisma.notificationDelivery.update({
      data: {
        lastError: input.lastError,
        receiptCheckedAt: input.now,
        status: input.markInvalid ? 'INVALID_TOKEN' : 'SENT',
      },
      where: { id: input.deliveryId },
    });
  }

  async settleDelivery(input: SettleDeliveryInput): Promise<void> {
    await this.prisma.notificationDelivery.update({
      data: {
        attempts: input.attempts,
        expoTicketId: input.decision.ticketId,
        lastError: input.decision.lastError,
        nextAttemptAt: input.decision.nextAttemptAt,
        sentAt: input.decision.status === 'SENT' ? input.now : null,
        status: input.decision.status as NotificationDeliveryStatus,
      },
      where: { id: input.deliveryId },
    });
  }

  private async insertDeliveries(planned: Array<{ deviceTokenId: string; eventId: string }>, now: Date): Promise<number> {
    if (planned.length === 0) {
      return 0;
    }
    const created = await this.prisma.notificationDelivery.createMany({
      data: planned.map((row) => ({
        deviceTokenId: row.deviceTokenId,
        eventId: row.eventId,
        id: randomUUID(),
        nextAttemptAt: now,
        status: 'PENDING' as const,
        updatedAt: now,
      })),
      skipDuplicates: true,
    });
    return created.count;
  }

  private async loadPreferences(events: Array<{ coachMembershipId: string | null }>): Promise<RecipientPreference[]> {
    const ids = unique(events.flatMap((event) => (event.coachMembershipId ? [event.coachMembershipId] : [])));
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.prisma.notificationPreference.findMany({
      where: { coachMembershipId: { in: ids } },
    });
    return rows.map((row) => ({
      coachMembershipId: row.coachMembershipId,
      enabled: row.enabled,
      topic: row.topic,
    }));
  }

  private async loadTokens(organizationIds: string[]): Promise<RecipientToken[]> {
    const rows = await this.prisma.notificationDeviceToken.findMany({
      where: { isActive: true, organizationId: { in: unique(organizationIds) } },
    });
    return rows.flatMap((row) => {
      const token = toRecipientToken(row);
      return token ? [token] : [];
    });
  }

  private async reclaimStaleSending(now: Date): Promise<void> {
    const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);
    await this.prisma.notificationDelivery.updateMany({
      data: { status: 'PENDING' },
      where: { status: 'SENDING', updatedAt: { lt: staleBefore } },
    });
  }
}

function toClaimed(
  row: {
    attempts: number;
    deviceToken: { id: string; token: string };
    deviceTokenId: string;
    event: { clientId: string | null; id: string; payloadJson: Prisma.JsonValue | null; topic: string };
    id: string;
  },
  recipientUserId: string | null,
): ClaimedDelivery {
  return {
    attempts: row.attempts,
    clientId: row.event.clientId,
    deliveryId: row.id,
    deviceTokenId: row.deviceTokenId,
    eventId: row.event.id,
    payload: readPayload(row.event.payloadJson),
    recipientUserId,
    token: row.deviceToken.token,
    topic: row.event.topic,
  };
}

async function loadRecipientUsers(
  prisma: PrismaService,
  rows: Array<{
    deviceToken: {
      client: { email: string } | null;
      id: string;
      membership: { user: { supabaseUid: string } } | null;
    };
    deviceTokenId: string;
  }>,
): Promise<Map<string, string>> {
  const recipients = new Map<string, string>();
  const emails = new Set<string>();
  for (const row of rows) {
    const supabaseUid = row.deviceToken.membership?.user.supabaseUid;
    if (supabaseUid) {
      recipients.set(row.deviceTokenId, supabaseUid);
    } else if (row.deviceToken.client?.email) {
      emails.add(row.deviceToken.client.email);
    }
  }
  if (emails.size === 0) {
    return recipients;
  }
  const users = await prisma.user.findMany({
    select: { email: true, supabaseUid: true },
    where: { email: { in: [...emails] } },
  });
  const byEmail = new Map(users.map((user) => [user.email, user.supabaseUid]));
  for (const row of rows) {
    const email = row.deviceToken.client?.email;
    const supabaseUid = email ? byEmail.get(email) : undefined;
    if (!recipients.has(row.deviceTokenId) && supabaseUid) {
      recipients.set(row.deviceTokenId, supabaseUid);
    }
  }
  return recipients;
}

function toRecipientEvent(event: {
  clientId: string | null;
  coachMembershipId: string | null;
  id: string;
  topic: string;
}): RecipientEvent {
  return {
    clientId: event.clientId,
    coachMembershipId: event.coachMembershipId,
    id: event.id,
    topic: event.topic,
  };
}

function toRecipientToken(row: {
  clientId: string | null;
  id: string;
  isActive: boolean;
  membershipId: string | null;
  role: string;
  token: string;
}): RecipientToken | null {
  if (row.role !== 'CLIENT' && row.role !== 'COACH') {
    return null;
  }
  return {
    clientId: row.clientId,
    id: row.id,
    isActive: row.isActive,
    membershipId: row.membershipId,
    role: row.role,
    token: row.token,
  };
}

function readPayload(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
