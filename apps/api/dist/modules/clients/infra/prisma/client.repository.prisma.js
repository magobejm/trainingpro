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
exports.ClientRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const client_repository_prisma_mappers_1 = require("./client.repository.prisma.mappers");
const client_repository_prisma_ops_1 = require("./client.repository.prisma.ops");
let ClientRepositoryPrisma = class ClientRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async archiveClient(context, clientId) {
        const membership = await (0, client_repository_prisma_ops_1.resolveCoachMembership)(context, this.prisma);
        await this.prisma.$transaction(async (tx) => {
            const client = await (0, client_repository_prisma_ops_1.readActiveClient)(tx, membership, clientId);
            await tx.client.update({
                where: { id: client.id },
                data: (0, audit_fields_1.buildArchiveAuditFields)(context),
            });
            await (0, client_repository_prisma_ops_1.decrementClientCount)(tx, membership.organizationId);
        });
    }
    async canCoachAccessClient(coachSubject, clientId) {
        const client = await this.prisma.client.findFirst({
            where: {
                id: clientId,
                coachMembership: {
                    archivedAt: null,
                    isActive: true,
                    role: client_1.Role.COACH,
                    user: { supabaseUid: coachSubject },
                },
            },
            select: { id: true },
        });
        return Boolean(client);
    }
    async createClient(context, input) {
        const membership = await (0, client_repository_prisma_ops_1.resolveCoachMembership)(context, this.prisma);
        const audit = (0, audit_fields_1.buildCreateAuditFields)(context);
        const normalizedInput = (0, client_repository_prisma_mappers_1.normalizeCreateInput)(input);
        const created = await this.runCreateClientTransaction(membership, normalizedInput, audit.updatedBy, audit);
        const hydrated = await this.prisma.client.findUnique({
            where: { id: created.id },
            include: { objectiveRef: true },
        });
        if (!hydrated) {
            throw new common_1.NotFoundException('Client not found after create');
        }
        return (0, client_repository_prisma_mappers_1.mapClient)(hydrated);
    }
    async getClientById(context, clientId) {
        const membership = await (0, client_repository_prisma_ops_1.resolveCoachMembership)(context, this.prisma);
        const client = await this.prisma.client.findFirst({
            include: { objectiveRef: true },
            where: {
                archivedAt: null,
                coachMembershipId: membership.id,
                id: clientId,
            },
        });
        return client ? (0, client_repository_prisma_mappers_1.mapClient)(client) : null;
    }
    async listClientsByCoach(context) {
        const membership = await (0, client_repository_prisma_ops_1.resolveCoachMembership)(context, this.prisma);
        const clients = await this.prisma.client.findMany({
            include: { objectiveRef: true },
            where: {
                archivedAt: null,
                coachMembershipId: membership.id,
            },
            orderBy: { createdAt: 'desc' },
        });
        return clients.map(client_repository_prisma_mappers_1.mapClient);
    }
    async updateClient(context, clientId, input) {
        const membership = await (0, client_repository_prisma_ops_1.resolveCoachMembership)(context, this.prisma);
        const updated = await this.prisma.$transaction(async (tx) => {
            const client = await (0, client_repository_prisma_ops_1.readActiveClient)(tx, membership, clientId);
            const payload = (0, client_repository_prisma_mappers_1.normalizeUpdateInput)(input);
            if (input.objectiveId !== undefined) {
                payload.objectiveRef = {
                    connect: { id: await resolveObjectiveId(tx, input.objectiveId) },
                };
            }
            return tx.client.update({
                where: { id: client.id },
                data: {
                    ...payload,
                    ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                },
                include: { objectiveRef: true },
            });
        });
        return (0, client_repository_prisma_mappers_1.mapClient)(updated);
    }
    async listObjectives() {
        const rows = await this.prisma.clientObjective.findMany({
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        });
        return rows.map(client_repository_prisma_mappers_1.mapObjective);
    }
    runCreateClientTransaction(membership, normalizedInput, updatedBy, audit) {
        const { clientSupabaseUid, objectiveId, ...clientData } = normalizedInput;
        return this.prisma.$transaction(async (tx) => {
            await this.ensureCreatePreconditions(tx, membership, clientData.email, clientSupabaseUid);
            const resolvedObjectiveId = await resolveObjectiveId(tx, objectiveId);
            const payload = {
                ...clientData,
                objectiveId: resolvedObjectiveId,
            };
            const client = await this.createOrRestoreClient(tx, membership, payload, audit, updatedBy);
            await (0, client_repository_prisma_ops_1.incrementClientCount)(tx, membership.organizationId);
            return client;
        });
    }
    async ensureCreatePreconditions(tx, membership, email, clientSupabaseUid) {
        await (0, client_repository_prisma_ops_1.ensureClientCapacity)(tx, membership.organizationId);
        await (0, client_repository_prisma_ops_1.ensureEmailNotUsedByPrivilegedMembership)(tx, membership.organizationId, email);
        await (0, client_repository_prisma_ops_1.ensureUniqueClientEmail)(tx, membership.organizationId, email);
        await (0, client_repository_prisma_ops_1.ensureClientMembership)(tx, membership.organizationId, { clientSupabaseUid, email });
    }
    async createOrRestoreClient(tx, membership, clientData, audit, updatedBy) {
        const { objectiveId, ...clientDataWithoutObjective } = clientData;
        const restored = await (0, client_repository_prisma_ops_1.tryRestoreArchivedClient)(tx, membership.organizationId, clientData, updatedBy);
        if (restored) {
            return restored;
        }
        return tx.client.create({
            data: {
                ...audit,
                coachMembershipId: membership.id,
                objectiveId,
                organizationId: membership.organizationId,
                ...clientDataWithoutObjective,
            },
            include: { objectiveRef: true },
        });
    }
};
exports.ClientRepositoryPrisma = ClientRepositoryPrisma;
exports.ClientRepositoryPrisma = ClientRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientRepositoryPrisma);
async function resolveObjectiveId(tx, inputObjectiveId) {
    if (inputObjectiveId) {
        const selected = await tx.clientObjective.findUnique({
            where: { id: inputObjectiveId },
            select: { id: true },
        });
        if (selected) {
            return selected.id;
        }
    }
    const fallback = await tx.clientObjective.findFirst({
        where: { isDefault: true },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        select: { id: true },
    });
    if (!fallback) {
        throw new common_1.ForbiddenException('Default client objective not found');
    }
    return fallback.id;
}
