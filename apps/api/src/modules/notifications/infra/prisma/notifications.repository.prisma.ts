import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationTopic as PrismaNotificationTopic,
  Role,
} from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  DEFAULT_PREFERENCE_TOPICS,
} from '../../domain/notifications.constants';
import type {
  NotificationTopic,
  NotificationsRepositoryPort,
  NotificationPreferenceView,
  RegisterDeviceTokenInput,
} from '../../domain/notifications.repository.port';
import {
  groupSessionsByClient,
  isUniqueError,
  mapPreferenceRow,
  toDateKey,
  toDateOnly,
  toJsonValue,
  toPrismaTopic,
} from './notifications.repository.helpers';

@Injectable()
export class NotificationsRepositoryPrisma implements NotificationsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async registerDeviceToken(context: AuthContext, input: RegisterDeviceTokenInput) {
    const owner = await this.resolveDeviceTokenOwner(context);
    await this.prisma.notificationDeviceToken.upsert({
      where: { token: input.token },
      create: {
        isActive: true,
        lastSeenAt: new Date(),
        membershipId: owner.membershipId,
        organizationId: owner.organizationId,
        platform: input.platform,
        role: owner.role,
        token: input.token,
      },
      update: {
        isActive: true,
        lastSeenAt: new Date(),
        membershipId: owner.membershipId,
        organizationId: owner.organizationId,
        platform: input.platform,
        role: owner.role,
      },
    });
  }

  async listPreferencesForCoach(context: AuthContext): Promise<NotificationPreferenceView[]> {
    const coachMembershipId = await this.readCoachMembershipId(context);
    await this.ensureDefaultPreferences(coachMembershipId);
    const rows = await this.prisma.notificationPreference.findMany({
      where: { coachMembershipId },
      orderBy: { topic: 'asc' },
    });
    return rows.map(mapPreferenceRow);
  }

  async setPreferenceForCoach(
    context: AuthContext,
    topic: NotificationTopic,
    enabled: boolean,
  ): Promise<NotificationPreferenceView> {
    const coachMembershipId = await this.readCoachMembershipId(context);
    const row = await this.prisma.notificationPreference.upsert({
      where: { coachMembershipId_topic: { coachMembershipId, topic: toPrismaTopic(topic) } },
      create: { coachMembershipId, enabled, topic: toPrismaTopic(topic) },
      update: { enabled },
    });
    return mapPreferenceRow(row);
  }

  async emitSessionCompletedEvent(sessionId: string): Promise<void> {
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, id: sessionId, isCompleted: true },
      select: { clientId: true, coachMembershipId: true, organizationId: true },
    });
    if (!row) {
      return;
    }
    await this.createEventIfMissing({
      clientId: row.clientId,
      coachMembershipId: row.coachMembershipId,
      dedupeKey: `session-completed:${sessionId}`,
      organizationId: row.organizationId,
      payloadJson: { sessionId },
      topic: PrismaNotificationTopic.SESSION_COMPLETED,
    });
  }

  async emitIncidentCriticalEvent(incidentId: string): Promise<void> {
    const row = await this.prisma.incident.findFirst({
      where: { archivedAt: null, id: incidentId, severity: 'CRITICAL' },
      select: { clientId: true, coachMembershipId: true, organizationId: true },
    });
    if (!row) {
      return;
    }
    await this.createEventIfMissing({
      clientId: row.clientId,
      coachMembershipId: row.coachMembershipId,
      dedupeKey: `incident-critical:${incidentId}`,
      organizationId: row.organizationId,
      payloadJson: { incidentId },
      topic: PrismaNotificationTopic.INCIDENT_CRITICAL,
    });
  }

  async runBatchJobs(now: Date): Promise<{ createdEvents: number }> {
    const inactive = await this.createInactiveClientEvents(now);
    const adherence = await this.createLowAdherenceEvents(now);
    const reminders = await this.createReminderEvents(now);
    return { createdEvents: inactive + adherence + reminders };
  }

  private async createInactiveClientEvents(now: Date): Promise<number> {
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() - 3);
    const clients = await this.prisma.client.findMany({
      where: { archivedAt: null },
      select: { coachMembershipId: true, id: true, organizationId: true },
    });
    let created = 0;
    for (const client of clients) {
      const last = await this.readLastCompletedSessionDate(client.id);
      if (!last || last < threshold) {
        created += await this.createEventIfMissing({
          clientId: client.id,
          coachMembershipId: client.coachMembershipId,
          dedupeKey: `inactive-3d:${client.id}:${toDateKey(now)}`,
          organizationId: client.organizationId,
          payloadJson: { lastCompletedAt: last?.toISOString() ?? null },
          topic: PrismaNotificationTopic.CLIENT_INACTIVE_3D,
        });
      }
    }
    return created;
  }

  private async createLowAdherenceEvents(now: Date): Promise<number> {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    const sessions = await this.prisma.sessionInstance.findMany({
      where: { archivedAt: null, sessionDate: { gte: from }, status: { in: ['COMPLETED', 'PENDING'] } },
      select: { clientId: true, coachMembershipId: true, isCompleted: true, organizationId: true },
    });
    const buckets = groupSessionsByClient(sessions);
    let created = 0;
    for (const item of buckets) {
      if (item.total < 2 || item.completed / item.total >= 0.5) {
        continue;
      }
      created += await this.createEventIfMissing({
        clientId: item.clientId,
        coachMembershipId: item.coachMembershipId,
        dedupeKey: `adherence-low:${item.clientId}:${toDateKey(now)}`,
        organizationId: item.organizationId,
        payloadJson: { completed: item.completed, total: item.total },
        topic: PrismaNotificationTopic.ADHERENCE_LOW_WEEKLY,
      });
    }
    return created;
  }

  private async createReminderEvents(now: Date): Promise<number> {
    const today = toDateOnly(now);
    const rows = await this.prisma.sessionInstance.findMany({
      where: { archivedAt: null, sessionDate: today, status: 'PENDING' },
      select: { clientId: true, coachMembershipId: true, id: true, organizationId: true },
    });
    let created = 0;
    for (const row of rows) {
      created += await this.createEventIfMissing({
        clientId: row.clientId,
        coachMembershipId: row.coachMembershipId,
        dedupeKey: `client-reminder:${row.id}:${toDateKey(now)}`,
        organizationId: row.organizationId,
        payloadJson: { sessionId: row.id },
        topic: PrismaNotificationTopic.CLIENT_REMINDER,
      });
    }
    return created;
  }

  private async createEventIfMissing(input: {
    clientId?: string;
    coachMembershipId?: string;
    dedupeKey: string;
    organizationId: string;
    payloadJson?: Record<string, unknown>;
    topic: PrismaNotificationTopic;
  }): Promise<number> {
    try {
      await this.prisma.notificationEventLog.create({
        data: {
          clientId: input.clientId ?? null,
          coachMembershipId: input.coachMembershipId ?? null,
          dedupeKey: input.dedupeKey,
          organizationId: input.organizationId,
          payloadJson: toJsonValue(input.payloadJson),
          topic: input.topic,
        },
      });
      return 1;
    } catch (error) {
      if (isUniqueError(error)) {
        return 0;
      }
      throw error;
    }
  }

  private async ensureDefaultPreferences(coachMembershipId: string): Promise<void> {
    for (const topic of DEFAULT_PREFERENCE_TOPICS) {
      await this.prisma.notificationPreference.upsert({
        where: { coachMembershipId_topic: { coachMembershipId, topic } },
        create: { coachMembershipId, enabled: true, topic },
        update: {},
      });
    }
  }

  private async readCoachMembershipId(context: AuthContext): Promise<string> {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can manage notification preferences');
    }
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: context.subject },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Coach membership not found');
    }
    return membership.id;
  }

  private async resolveDeviceTokenOwner(context: AuthContext): Promise<{
    membershipId: null | string;
    organizationId: string;
    role: Role;
  }> {
    if (context.activeRole === 'coach') {
      return this.readCoachOwner(context.subject);
    }
    if (context.activeRole === 'client') {
      return this.readClientOwner(context.email);
    }
    throw new ForbiddenException('Only coach/client can register device token');
  }

  private async readCoachOwner(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: subject },
      },
      select: { id: true, organizationId: true },
    });
    if (!membership) {
      throw new NotFoundException('Coach membership not found');
    }
    return {
      membershipId: membership.id,
      organizationId: membership.organizationId,
      role: Role.COACH,
    };
  }

  private async readClientOwner(email: string | undefined) {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email: email ?? '' },
      select: { organizationId: true },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return { membershipId: null, organizationId: client.organizationId, role: Role.CLIENT };
  }

  private async readLastCompletedSessionDate(clientId: string): Promise<Date | null> {
    const row = await this.prisma.sessionInstance.findFirst({
      where: { archivedAt: null, clientId, isCompleted: true },
      orderBy: { sessionDate: 'desc' },
      select: { sessionDate: true },
    });
    return row?.sessionDate ?? null;
  }
}
