import {
  NotificationTopic as PrismaNotificationTopic,
  Prisma,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type {
  NotificationPreferenceView,
  NotificationTopic,
} from '../../domain/notifications.repository.port';

export type SessionBucket = {
  clientId: string;
  coachMembershipId: string;
  completed: number;
  organizationId: string;
  total: number;
};

export function groupSessionsByClient(
  rows: Array<{
    clientId: string;
    coachMembershipId: string;
    isCompleted: boolean;
    organizationId: string;
  }>,
): SessionBucket[] {
  const buckets = new Map<string, SessionBucket>();
  for (const row of rows) {
    const current = buckets.get(row.clientId) ?? createBucket(row);
    current.total += 1;
    if (row.isCompleted) {
      current.completed += 1;
    }
    buckets.set(row.clientId, current);
  }
  return [...buckets.values()];
}

export function isUniqueError(error: unknown): boolean {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
}

export function mapPreferenceRow(row: {
  coachMembershipId: string;
  enabled: boolean;
  topic: PrismaNotificationTopic;
}): NotificationPreferenceView {
  return {
    coachMembershipId: row.coachMembershipId,
    enabled: row.enabled,
    topic: row.topic,
  };
}

export function toDateOnly(now: Date): Date {
  const value = new Date(now);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function toDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function toPrismaTopic(topic: NotificationTopic): PrismaNotificationTopic {
  return topic as PrismaNotificationTopic;
}

export function toJsonValue(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}

function createBucket(row: {
  clientId: string;
  coachMembershipId: string;
  organizationId: string;
}): SessionBucket {
  return {
    clientId: row.clientId,
    coachMembershipId: row.coachMembershipId,
    completed: 0,
    organizationId: row.organizationId,
    total: 0,
  };
}
