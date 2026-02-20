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
exports.SessionsRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const sessions_prisma_mappers_1 = require("./sessions-prisma.mappers");
const sessions_cardio_repository_prisma_1 = require("./sessions-cardio.repository.prisma");
const sessions_strength_prisma_helpers_1 = require("./sessions-strength.prisma.helpers");
let SessionsRepositoryPrisma = class SessionsRepositoryPrisma {
    prisma;
    cardioRepository;
    constructor(prisma, cardioRepository) {
        this.prisma = prisma;
        this.cardioRepository = cardioRepository;
    }
    async canAccessSession(context, sessionId) {
        if (context.activeRole === 'admin') {
            return false;
        }
        if (context.activeRole === 'coach') {
            return this.canCoachAccessSession(context, sessionId);
        }
        return this.canClientAccessSession(context, sessionId);
    }
    ensureCardioSession(context, input) {
        return this.cardioRepository.ensureCardioSession(context, input);
    }
    async ensureSession(context, input) {
        const membership = await this.resolveCoachMembership(context);
        const existing = await this.prisma.sessionInstance.findFirst({
            where: {
                archivedAt: null,
                clientId: input.clientId,
                sessionDate: input.sessionDate,
            },
            include: (0, sessions_strength_prisma_helpers_1.sessionInclude)(),
        });
        if (existing) {
            return (0, sessions_strength_prisma_helpers_1.mapSession)(existing);
        }
        const template = await this.readTemplateSnapshot(input.templateId, membership.id);
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
                items: { create: template.items.map(sessions_prisma_mappers_1.mapSessionItemCreate) },
            },
            include: (0, sessions_strength_prisma_helpers_1.sessionInclude)(),
        });
        return (0, sessions_strength_prisma_helpers_1.mapSession)(row);
    }
    finishCardioSession(context, input) {
        return this.cardioRepository.finishCardioSession(context, input);
    }
    async finishSession(context, input) {
        const session = await this.readSessionForMutation(input.sessionId);
        (0, sessions_prisma_mappers_1.assertSessionMutable)(session.status);
        const updated = await this.prisma.sessionInstance.update({
            where: { id: session.id },
            data: {
                ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                finishComment: (0, sessions_strength_prisma_helpers_1.normalizeText)(input.comment),
                finishedAt: new Date(),
                isCompleted: true,
                isIncomplete: input.isIncomplete,
                status: client_1.SessionStatus.COMPLETED,
            },
            include: (0, sessions_strength_prisma_helpers_1.sessionInclude)(),
        });
        return (0, sessions_strength_prisma_helpers_1.mapSession)(updated);
    }
    getCardioSessionById(context, sessionId) {
        return this.cardioRepository.getCardioSessionById(context, sessionId);
    }
    async getSessionById(context, sessionId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, id: sessionId },
            include: (0, sessions_strength_prisma_helpers_1.sessionInclude)(),
        });
        void context;
        return row ? (0, sessions_strength_prisma_helpers_1.mapSession)(row) : null;
    }
    logInterval(context, input) {
        return this.cardioRepository.logInterval(context, input);
    }
    async logSet(context, input) {
        const session = await this.readSessionForMutation(input.sessionId);
        (0, sessions_prisma_mappers_1.assertSessionMutable)(session.status);
        const item = await this.readSessionItem(input.sessionId, input.sessionItemId);
        if (!item) {
            throw new common_1.NotFoundException('Session item not found');
        }
        const row = await this.upsertSetLog(input, item.id);
        void context;
        return (0, sessions_prisma_mappers_1.mapSetLog)(row);
    }
    startCardioSession(context, sessionId) {
        return this.cardioRepository.startCardioSession(context, sessionId);
    }
    async startSession(context, sessionId) {
        const session = await this.readSessionForMutation(sessionId);
        if (session.startedAt || session.status === client_1.SessionStatus.COMPLETED) {
            return (0, sessions_strength_prisma_helpers_1.mapSession)(session);
        }
        const updated = await this.prisma.sessionInstance.update({
            where: { id: session.id },
            data: {
                ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                startedAt: new Date(),
                status: client_1.SessionStatus.IN_PROGRESS,
            },
            include: (0, sessions_strength_prisma_helpers_1.sessionInclude)(),
        });
        return (0, sessions_strength_prisma_helpers_1.mapSession)(updated);
    }
    async canCoachAccessSession(context, sessionId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: {
                archivedAt: null,
                id: sessionId,
                coachMembership: {
                    archivedAt: null,
                    isActive: true,
                    role: client_1.Role.COACH,
                    user: { supabaseUid: context.subject },
                },
            },
            select: { id: true },
        });
        return Boolean(row);
    }
    async canClientAccessSession(context, sessionId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, id: sessionId, client: { email: context.email ?? '' } },
            select: { id: true },
        });
        return Boolean(row);
    }
    async readSessionForMutation(sessionId) {
        const row = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, id: sessionId },
            include: (0, sessions_strength_prisma_helpers_1.sessionInclude)(),
        });
        if (!row) {
            throw new common_1.NotFoundException('Session not found');
        }
        return row;
    }
    async readTemplateSnapshot(templateId, coachMembershipId) {
        const row = await this.readStrengthTemplate(templateId, coachMembershipId);
        if (!row) {
            throw new common_1.NotFoundException('Strength template not found');
        }
        const exercises = (0, sessions_prisma_mappers_1.readFirstDayExercises)(row.days);
        if (!exercises) {
            throw new common_1.BadRequestException('Template has no exercises');
        }
        return {
            id: row.id,
            items: exercises,
            templateVersion: row.templateVersion,
        };
    }
    async resolveCoachMembership(context) {
        if (context.activeRole !== 'coach') {
            throw new common_1.ForbiddenException('Only coach can create/ensure sessions');
        }
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
            throw new common_1.ForbiddenException('Coach membership not found');
        }
        return membership;
    }
    readSessionItem(sessionId, sessionItemId) {
        return this.prisma.sessionStrengthItem.findFirst({
            where: { archivedAt: null, id: sessionItemId, sessionId },
            select: { id: true },
        });
    }
    upsertSetLog(input, sessionItemId) {
        return this.prisma.setLog.upsert({
            where: { sessionItemId_setIndex: { sessionItemId, setIndex: input.setIndex } },
            create: {
                effortRpe: input.effortRpe ?? null,
                repsDone: input.repsDone ?? null,
                sessionId: input.sessionId,
                sessionItemId,
                setIndex: input.setIndex,
                weightDoneKg: (0, sessions_strength_prisma_helpers_1.toDecimal)(input.weightDoneKg),
            },
            update: {
                effortRpe: input.effortRpe ?? null,
                repsDone: input.repsDone ?? null,
                weightDoneKg: (0, sessions_strength_prisma_helpers_1.toDecimal)(input.weightDoneKg),
            },
        });
    }
    readStrengthTemplate(templateId, coachMembershipId) {
        return this.prisma.planTemplate.findFirst({
            where: {
                archivedAt: null,
                coachMembershipId,
                id: templateId,
                kind: client_1.TemplateKind.STRENGTH,
            },
            include: {
                days: {
                    where: { archivedAt: null },
                    orderBy: { dayIndex: 'asc' },
                    include: {
                        exercises: {
                            where: { archivedAt: null },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });
    }
};
exports.SessionsRepositoryPrisma = SessionsRepositoryPrisma;
exports.SessionsRepositoryPrisma = SessionsRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sessions_cardio_repository_prisma_1.SessionsCardioRepositoryPrisma])
], SessionsRepositoryPrisma);
