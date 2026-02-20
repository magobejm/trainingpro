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
exports.SessionsCardioRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const sessions_cardio_prisma_helpers_1 = require("./sessions-cardio.prisma.helpers");
let SessionsCardioRepositoryPrisma = class SessionsCardioRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureCardioSession(context, input) {
        const membership = await this.resolveCoachMembership(context);
        const existing = await this.readExistingSession(input);
        if (existing) {
            return this.assertAndMapExisting(existing);
        }
        return this.createCardioSession(context, input, membership);
    }
    async finishCardioSession(context, input) {
        const session = await this.readCardioSessionForMutation(input.sessionId);
        (0, sessions_cardio_prisma_helpers_1.assertCardioSessionMutable)(session.status);
        const updated = await this.prisma.sessionInstance.update({
            where: { id: session.id },
            data: {
                ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                finishComment: normalizeText(input.comment),
                finishedAt: new Date(),
                isCompleted: true,
                isIncomplete: input.isIncomplete,
                status: client_1.SessionStatus.COMPLETED,
            },
            include: (0, sessions_cardio_prisma_helpers_1.cardioSessionInclude)(),
        });
        return (0, sessions_cardio_prisma_helpers_1.mapCardioSession)(updated);
    }
    async getCardioSessionById(context, sessionId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, id: sessionId },
            include: (0, sessions_cardio_prisma_helpers_1.cardioSessionInclude)(),
        });
        void context;
        if (!row || row.template.kind !== client_1.TemplateKind.CARDIO) {
            return null;
        }
        return (0, sessions_cardio_prisma_helpers_1.mapCardioSession)(row);
    }
    async logInterval(context, input) {
        const session = await this.readCardioSessionForMutation(input.sessionId);
        (0, sessions_cardio_prisma_helpers_1.assertCardioSessionMutable)(session.status);
        const block = await this.readSessionCardioBlock(input.sessionId, input.sessionCardioBlockId);
        if (!block) {
            throw new common_1.NotFoundException('Session cardio block not found');
        }
        const row = await this.upsertIntervalLog(input, block.id);
        void context;
        return (0, sessions_cardio_prisma_helpers_1.mapCardioIntervalLog)(row);
    }
    async startCardioSession(context, sessionId) {
        const session = await this.readCardioSessionForMutation(sessionId);
        if (session.startedAt || session.status === client_1.SessionStatus.COMPLETED) {
            return (0, sessions_cardio_prisma_helpers_1.mapCardioSession)(session);
        }
        const updated = await this.prisma.sessionInstance.update({
            where: { id: session.id },
            data: {
                ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                startedAt: new Date(),
                status: client_1.SessionStatus.IN_PROGRESS,
            },
            include: (0, sessions_cardio_prisma_helpers_1.cardioSessionInclude)(),
        });
        return (0, sessions_cardio_prisma_helpers_1.mapCardioSession)(updated);
    }
    readExistingSession(input) {
        return this.prisma.sessionInstance.findFirst({
            where: {
                archivedAt: null,
                clientId: input.clientId,
                sessionDate: input.sessionDate,
            },
            include: (0, sessions_cardio_prisma_helpers_1.cardioSessionInclude)(),
        });
    }
    assertAndMapExisting(existing) {
        if (existing.template.kind !== client_1.TemplateKind.CARDIO) {
            throw new common_1.BadRequestException('Session date already used by strength template');
        }
        return (0, sessions_cardio_prisma_helpers_1.mapCardioSession)(existing);
    }
    async createCardioSession(context, input, membership) {
        const template = await this.readCardioTemplateSnapshot(input.templateId, membership.id);
        const row = await this.prisma.sessionInstance.create({
            data: {
                ...(0, audit_fields_1.buildCreateAuditFields)(context),
                clientId: input.clientId,
                coachMembershipId: membership.id,
                organizationId: membership.organizationId,
                sessionDate: input.sessionDate,
                sourceTemplateId: template.id,
                sourceTemplateVersion: template.templateVersion,
                status: client_1.SessionStatus.PENDING,
                cardioBlocks: { create: template.blocks.map(sessions_cardio_prisma_helpers_1.mapCardioSessionBlockCreate) },
            },
            include: (0, sessions_cardio_prisma_helpers_1.cardioSessionInclude)(),
        });
        return (0, sessions_cardio_prisma_helpers_1.mapCardioSession)(row);
    }
    async readCardioSessionForMutation(sessionId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, id: sessionId },
            include: (0, sessions_cardio_prisma_helpers_1.cardioSessionInclude)(),
        });
        if (!row || row.template.kind !== client_1.TemplateKind.CARDIO) {
            throw new common_1.NotFoundException('Cardio session not found');
        }
        return row;
    }
    async readCardioTemplateSnapshot(templateId, coachMembershipId) {
        const row = await this.readCardioTemplate(templateId, coachMembershipId);
        if (!row) {
            throw new common_1.NotFoundException('Cardio template not found');
        }
        const blocks = (0, sessions_cardio_prisma_helpers_1.readFirstDayCardioBlocks)(row.days);
        if (!blocks) {
            throw new common_1.BadRequestException('Template has no cardio blocks');
        }
        return {
            blocks,
            id: row.id,
            templateVersion: row.templateVersion,
        };
    }
    async resolveCoachMembership(context) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.COACH,
                user: { supabaseUid: context.subject },
            },
            select: { id: true, organizationId: true },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Coach membership not found');
        }
        return membership;
    }
    readSessionCardioBlock(sessionId, sessionCardioBlockId) {
        return this.prisma.sessionCardioBlock.findFirst({
            where: { archivedAt: null, id: sessionCardioBlockId, sessionId },
            select: { id: true },
        });
    }
    readCardioTemplate(templateId, coachMembershipId) {
        return this.prisma.planTemplate.findFirst({
            where: {
                archivedAt: null,
                coachMembershipId,
                id: templateId,
                kind: client_1.TemplateKind.CARDIO,
            },
            include: {
                days: {
                    where: { archivedAt: null },
                    orderBy: { dayIndex: 'asc' },
                    include: {
                        cardioBlocks: {
                            where: { archivedAt: null },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });
    }
    upsertIntervalLog(input, sessionCardioBlockId) {
        return this.prisma.intervalLog.upsert({
            where: {
                sessionCardioBlockId_intervalIndex: {
                    intervalIndex: input.intervalIndex,
                    sessionCardioBlockId,
                },
            },
            create: {
                avgHeartRate: input.avgHeartRate ?? null,
                distanceDoneMeters: input.distanceDoneMeters ?? null,
                durationSecondsDone: input.durationSecondsDone ?? null,
                effortRpe: input.effortRpe ?? null,
                intervalIndex: input.intervalIndex,
                sessionCardioBlockId,
                sessionId: input.sessionId,
            },
            update: {
                avgHeartRate: input.avgHeartRate ?? null,
                distanceDoneMeters: input.distanceDoneMeters ?? null,
                durationSecondsDone: input.durationSecondsDone ?? null,
                effortRpe: input.effortRpe ?? null,
            },
        });
    }
};
exports.SessionsCardioRepositoryPrisma = SessionsCardioRepositoryPrisma;
exports.SessionsCardioRepositoryPrisma = SessionsCardioRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsCardioRepositoryPrisma);
function normalizeText(value) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}
