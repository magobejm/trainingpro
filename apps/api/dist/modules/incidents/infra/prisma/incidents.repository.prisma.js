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
exports.IncidentsRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const incident_prisma_mappers_1 = require("./incident-prisma.mappers");
let IncidentsRepositoryPrisma = class IncidentsRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addAdjustmentDraft(context, incidentId, draft) {
        const incident = await this.readCoachIncident(context, incidentId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const row = await tx.incident.update({
                where: { id: incident.id },
                data: { adjustmentDraft: draft, ...(0, audit_fields_1.buildUpdateAuditFields)(context) },
            });
            await tx.incidentAction.create({
                data: {
                    actionType: client_1.IncidentActionType.ADJUSTMENT_DRAFTED,
                    createdBy: context.subject,
                    incidentId,
                },
            });
            return row;
        });
        return (0, incident_prisma_mappers_1.mapIncident)(updated);
    }
    async addCoachResponse(context, incidentId, response) {
        const incident = await this.readCoachIncident(context, incidentId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const row = await tx.incident.update({
                where: { id: incident.id },
                data: {
                    coachResponse: response,
                    reviewedAt: incident.reviewedAt ?? new Date(),
                    status: client_1.IncidentStatus.REVIEWED,
                    ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                },
            });
            await tx.incidentAction.create({
                data: { actionType: client_1.IncidentActionType.RESPONDED, createdBy: context.subject, incidentId },
            });
            return row;
        });
        return (0, incident_prisma_mappers_1.mapIncident)(updated);
    }
    async addTag(context, incidentId, tag) {
        const incident = await this.readCoachIncident(context, incidentId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const row = await tx.incident.update({
                where: { id: incident.id },
                data: { tag, ...(0, audit_fields_1.buildUpdateAuditFields)(context) },
            });
            await tx.incidentAction.create({
                data: {
                    actionType: client_1.IncidentActionType.TAGGED,
                    createdBy: context.subject,
                    incidentId,
                    payloadJson: { tag },
                },
            });
            return row;
        });
        return (0, incident_prisma_mappers_1.mapIncident)(updated);
    }
    async createIncident(context, input) {
        const client = await this.readClientForContext(context);
        await this.assertSessionLink(client.id, input.sessionId, input.sessionItemId);
        const coachAlertedAt = this.readAlertDate(input.severity);
        const incidentData = this.buildCreateData(context, input, client, coachAlertedAt);
        const created = await this.prisma.$transaction(async (tx) => {
            const incident = await tx.incident.create({ data: incidentData });
            if (coachAlertedAt) {
                await this.createAlertAction(tx, context.subject, incident.id, input.severity);
            }
            return incident;
        });
        return (0, incident_prisma_mappers_1.mapIncident)(created);
    }
    async listActions(context, incidentId) {
        await this.readIncidentForContext(context, incidentId);
        const rows = await this.prisma.incidentAction.findMany({
            where: { incidentId },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map(incident_prisma_mappers_1.mapAction);
    }
    async listIncidents(context, query) {
        const rows = await this.prisma.incident.findMany({
            where: await this.buildListWhere(context, query),
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(incident_prisma_mappers_1.mapIncident);
    }
    async markReviewed(context, incidentId) {
        const incident = await this.readCoachIncident(context, incidentId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const row = await tx.incident.update({
                where: { id: incident.id },
                data: {
                    reviewedAt: incident.reviewedAt ?? new Date(),
                    status: client_1.IncidentStatus.REVIEWED,
                    ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                },
            });
            await tx.incidentAction.create({
                data: { actionType: client_1.IncidentActionType.REVIEWED, createdBy: context.subject, incidentId },
            });
            return row;
        });
        return (0, incident_prisma_mappers_1.mapIncident)(updated);
    }
    async assertSessionLink(clientId, sessionId, sessionItemId) {
        if (!sessionId && !sessionItemId) {
            return;
        }
        if (sessionId) {
            const session = await this.prisma.sessionInstance.findFirst({
                where: { archivedAt: null, clientId, id: sessionId },
                select: { id: true },
            });
            if (!session) {
                throw new common_1.ForbiddenException('Session link does not belong to current client');
            }
        }
        if (sessionItemId) {
            const item = await this.prisma.sessionStrengthItem.findFirst({
                where: { archivedAt: null, id: sessionItemId, session: { clientId } },
                select: { id: true },
            });
            if (!item) {
                throw new common_1.ForbiddenException('Session item link does not belong to current client');
            }
        }
    }
    async buildListWhere(context, query) {
        if (context.activeRole === 'coach') {
            return this.buildCoachListWhere(context, query);
        }
        if (context.activeRole === 'client') {
            const client = await this.readClientByEmail(context.email ?? '');
            return {
                archivedAt: null,
                clientId: client.id,
                status: query.status,
            };
        }
        throw new common_1.ForbiddenException('Admin cannot access incidents');
    }
    async buildCoachListWhere(context, query) {
        const membership = await this.readCoachMembership(context.subject);
        if (query.clientId) {
            await this.assertCoachClient(membership.id, query.clientId);
        }
        return {
            archivedAt: null,
            clientId: query.clientId,
            coachMembershipId: membership.id,
            status: query.status,
        };
    }
    async readClientByEmail(email) {
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, email },
            select: { coachMembershipId: true, id: true, organizationId: true },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        return client;
    }
    readClientForContext(context) {
        if (context.activeRole !== 'client') {
            throw new common_1.ForbiddenException('Only client can create incidents');
        }
        return this.readClientByEmail(context.email ?? '');
    }
    async readCoachIncident(context, incidentId) {
        if (context.activeRole !== 'coach') {
            throw new common_1.ForbiddenException('Only coach can execute this action');
        }
        const membership = await this.readCoachMembership(context.subject);
        const incident = await this.prisma.incident.findFirst({
            where: { archivedAt: null, coachMembershipId: membership.id, id: incidentId },
        });
        if (!incident) {
            throw new common_1.NotFoundException('Incident not found');
        }
        return incident;
    }
    async readCoachMembership(subject) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.COACH,
                user: { supabaseUid: subject },
            },
            select: { id: true },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Coach membership not found');
        }
        return membership;
    }
    async readIncidentForContext(context, incidentId) {
        if (context.activeRole === 'coach') {
            return this.readCoachIncident(context, incidentId);
        }
        if (context.activeRole === 'client') {
            const client = await this.readClientByEmail(context.email ?? '');
            const incident = await this.prisma.incident.findFirst({
                where: { archivedAt: null, clientId: client.id, id: incidentId },
            });
            if (!incident) {
                throw new common_1.NotFoundException('Incident not found');
            }
            return incident;
        }
        throw new common_1.ForbiddenException('Admin cannot access incidents');
    }
    async assertCoachClient(coachMembershipId, clientId) {
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, coachMembershipId, id: clientId },
            select: { id: true },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client not found for current coach');
        }
    }
    buildCreateData(context, input, client, coachAlertedAt) {
        return {
            ...(0, audit_fields_1.buildCreateAuditFields)(context),
            clientId: client.id,
            coachAlertedAt,
            coachMembershipId: client.coachMembershipId,
            description: input.description,
            organizationId: client.organizationId,
            sessionId: input.sessionId ?? null,
            sessionItemId: input.sessionItemId ?? null,
            severity: input.severity,
        };
    }
    async createAlertAction(tx, subject, incidentId, severity) {
        await tx.incidentAction.create({
            data: {
                actionType: client_1.IncidentActionType.ALERTED,
                createdBy: subject,
                incidentId,
                payloadJson: { severity },
            },
        });
    }
    readAlertDate(severity) {
        return (0, incident_prisma_mappers_1.mustAlertCoach)(severity) ? new Date() : null;
    }
};
exports.IncidentsRepositoryPrisma = IncidentsRepositoryPrisma;
exports.IncidentsRepositoryPrisma = IncidentsRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncidentsRepositoryPrisma);
