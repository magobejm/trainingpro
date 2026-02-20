"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const notifications_constants_1 = require("../../domain/notifications.constants");
const notifications_repository_helpers_1 = require("./notifications.repository.helpers");
let NotificationsRepositoryPrisma = class NotificationsRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerDeviceToken(context, input) {
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
    async listPreferencesForCoach(context) {
        const coachMembershipId = await this.readCoachMembershipId(context);
        await this.ensureDefaultPreferences(coachMembershipId);
        const rows = await this.prisma.notificationPreference.findMany({
            where: { coachMembershipId },
            orderBy: { topic: 'asc' },
        });
        return rows.map(notifications_repository_helpers_1.mapPreferenceRow);
    }
    async setPreferenceForCoach(context, topic, enabled) {
        const coachMembershipId = await this.readCoachMembershipId(context);
        const row = await this.prisma.notificationPreference.upsert({
            where: { coachMembershipId_topic: { coachMembershipId, topic: (0, notifications_repository_helpers_1.toPrismaTopic)(topic) } },
            create: { coachMembershipId, enabled, topic: (0, notifications_repository_helpers_1.toPrismaTopic)(topic) },
            update: { enabled },
        });
        return (0, notifications_repository_helpers_1.mapPreferenceRow)(row);
    }
    async emitSessionCompletedEvent(sessionId) {
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
            topic: client_1.NotificationTopic.SESSION_COMPLETED,
        });
    }
    async emitIncidentCriticalEvent(incidentId) {
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
            topic: client_1.NotificationTopic.INCIDENT_CRITICAL,
        });
    }
    async runBatchJobs(now) {
        const inactive = await this.createInactiveClientEvents(now);
        const adherence = await this.createLowAdherenceEvents(now);
        const reminders = await this.createReminderEvents(now);
        return { createdEvents: inactive + adherence + reminders };
    }
    async createInactiveClientEvents(now) {
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
                    dedupeKey: `inactive-3d:${client.id}:${(0, notifications_repository_helpers_1.toDateKey)(now)}`,
                    organizationId: client.organizationId,
                    payloadJson: { lastCompletedAt: last?.toISOString() ?? null },
                    topic: client_1.NotificationTopic.CLIENT_INACTIVE_3D,
                });
            }
        }
        return created;
    }
    async createLowAdherenceEvents(now) {
        const from = new Date(now);
        from.setDate(from.getDate() - 7);
        const sessions = await this.prisma.sessionInstance.findMany({
            where: { archivedAt: null, sessionDate: { gte: from }, status: { in: ['COMPLETED', 'PENDING'] } },
            select: { clientId: true, coachMembershipId: true, isCompleted: true, organizationId: true },
        });
        const buckets = (0, notifications_repository_helpers_1.groupSessionsByClient)(sessions);
        let created = 0;
        for (const item of buckets) {
            if (item.total < 2 || item.completed / item.total >= 0.5) {
                continue;
            }
            created += await this.createEventIfMissing({
                clientId: item.clientId,
                coachMembershipId: item.coachMembershipId,
                dedupeKey: `adherence-low:${item.clientId}:${(0, notifications_repository_helpers_1.toDateKey)(now)}`,
                organizationId: item.organizationId,
                payloadJson: { completed: item.completed, total: item.total },
                topic: client_1.NotificationTopic.ADHERENCE_LOW_WEEKLY,
            });
        }
        return created;
    }
    async createReminderEvents(now) {
        const today = (0, notifications_repository_helpers_1.toDateOnly)(now);
        const rows = await this.prisma.sessionInstance.findMany({
            where: { archivedAt: null, sessionDate: today, status: 'PENDING' },
            select: { clientId: true, coachMembershipId: true, id: true, organizationId: true },
        });
        let created = 0;
        for (const row of rows) {
            created += await this.createEventIfMissing({
                clientId: row.clientId,
                coachMembershipId: row.coachMembershipId,
                dedupeKey: `client-reminder:${row.id}:${(0, notifications_repository_helpers_1.toDateKey)(now)}`,
                organizationId: row.organizationId,
                payloadJson: { sessionId: row.id },
                topic: client_1.NotificationTopic.CLIENT_REMINDER,
            });
        }
        return created;
    }
    async createEventIfMissing(input) {
        try {
            await this.prisma.notificationEventLog.create({
                data: {
                    clientId: input.clientId ?? null,
                    coachMembershipId: input.coachMembershipId ?? null,
                    dedupeKey: input.dedupeKey,
                    organizationId: input.organizationId,
                    payloadJson: (0, notifications_repository_helpers_1.toJsonValue)(input.payloadJson),
                    topic: input.topic,
                },
            });
            return 1;
        }
        catch (error) {
            if ((0, notifications_repository_helpers_1.isUniqueError)(error)) {
                return 0;
            }
            throw error;
        }
    }
    async ensureDefaultPreferences(coachMembershipId) {
        for (const topic of notifications_constants_1.DEFAULT_PREFERENCE_TOPICS) {
            await this.prisma.notificationPreference.upsert({
                where: { coachMembershipId_topic: { coachMembershipId, topic } },
                create: { coachMembershipId, enabled: true, topic },
                update: {},
            });
        }
    }
    async readCoachMembershipId(context) {
        if (context.activeRole !== 'coach') {
            throw new common_1.ForbiddenException('Only coach can manage notification preferences');
        }
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.COACH,
                user: { supabaseUid: context.subject },
            },
            select: { id: true },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Coach membership not found');
        }
        return membership.id;
    }
    async resolveDeviceTokenOwner(context) {
        if (context.activeRole === 'coach') {
            return this.readCoachOwner(context.subject);
        }
        if (context.activeRole === 'client') {
            return this.readClientOwner(context.email);
        }
        throw new common_1.ForbiddenException('Only coach/client can register device token');
    }
    async readCoachOwner(subject) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.COACH,
                user: { supabaseUid: subject },
            },
            select: { id: true, organizationId: true },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Coach membership not found');
        }
        return {
            membershipId: membership.id,
            organizationId: membership.organizationId,
            role: client_1.Role.COACH,
        };
    }
    async readClientOwner(email) {
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, email: email ?? '' },
            select: { organizationId: true },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        return { membershipId: null, organizationId: client.organizationId, role: client_1.Role.CLIENT };
    }
    async readLastCompletedSessionDate(clientId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, clientId, isCompleted: true },
            orderBy: { sessionDate: 'desc' },
            select: { sessionDate: true },
        });
        return row?.sessionDate ?? null;
    }
};
exports.NotificationsRepositoryPrisma = NotificationsRepositoryPrisma;
exports.NotificationsRepositoryPrisma = NotificationsRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsRepositoryPrisma);
