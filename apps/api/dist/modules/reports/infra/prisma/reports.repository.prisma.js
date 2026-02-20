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
exports.ReportsRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const weekly_report_policy_1 = require("../../domain/policies/weekly-report.policy");
const weekly_report_prisma_mappers_1 = require("./weekly-report-prisma.mappers");
let ReportsRepositoryPrisma = class ReportsRepositoryPrisma {
    policy;
    prisma;
    constructor(policy, prisma) {
        this.policy = policy;
        this.prisma = prisma;
    }
    async getWeeklyReportByDate(context, reportDate) {
        const client = await this.readClientForContext(context);
        const weekStartDate = this.policy.resolveWeekStart(reportDate);
        const row = await this.prisma.weeklyReport.findFirst({
            where: { clientId: client.id, weekStartDate },
        });
        return row ? (0, weekly_report_prisma_mappers_1.mapWeeklyReport)(row) : null;
    }
    async upsertWeeklyReport(context, input) {
        const client = await this.readClientForContext(context);
        if (input.sourceSessionId) {
            await this.assertSourceSession(client.id, input.reportDate, input.sourceSessionId);
        }
        const weekStartDate = this.policy.resolveWeekStart(input.reportDate);
        const row = await this.prisma.weeklyReport.upsert({
            where: { clientId_weekStartDate: { clientId: client.id, weekStartDate } },
            create: this.buildCreateData(context, input, client, weekStartDate),
            update: this.buildUpdateData(context, input),
        });
        return (0, weekly_report_prisma_mappers_1.mapWeeklyReport)(row);
    }
    async assertSourceSession(clientId, reportDate, sourceSessionId) {
        const session = await this.prisma.sessionInstance.findFirst({
            where: { archivedAt: null, clientId, id: sourceSessionId, status: client_1.SessionStatus.COMPLETED },
            select: { sessionDate: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Completed source session not found for client');
        }
        this.policy.ensureSessionDateMatchesReportDate(reportDate, session.sessionDate);
    }
    buildCreateData(context, input, client, weekStartDate) {
        return {
            ...(0, audit_fields_1.buildCreateAuditFields)(context),
            adherencePercent: input.adherencePercent ?? null,
            coachMembershipId: client.coachMembershipId,
            clientId: client.id,
            energy: input.energy ?? null,
            mood: input.mood ?? null,
            notes: input.notes ?? null,
            organizationId: client.organizationId,
            reportDate: input.reportDate,
            sleepHours: toDecimal(input.sleepHours),
            sourceSessionId: input.sourceSessionId ?? null,
            weekStartDate,
        };
    }
    buildUpdateData(context, input) {
        return {
            ...(0, audit_fields_1.buildUpdateAuditFields)(context),
            adherencePercent: input.adherencePercent ?? null,
            energy: input.energy ?? null,
            mood: input.mood ?? null,
            notes: input.notes ?? null,
            reportDate: input.reportDate,
            sleepHours: toDecimal(input.sleepHours),
            sourceSessionId: input.sourceSessionId ?? null,
        };
    }
    async readClientForContext(context) {
        if (context.activeRole !== 'client') {
            throw new common_1.ForbiddenException('Only client can manage weekly reports');
        }
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, email: context.email ?? '' },
            select: { coachMembershipId: true, id: true, organizationId: true },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        await this.assertCoachMembership(client.coachMembershipId);
        return client;
    }
    async assertCoachMembership(coachMembershipId) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: { archivedAt: null, id: coachMembershipId, isActive: true, role: client_1.Role.COACH },
            select: { id: true },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Coach membership not found');
        }
    }
};
exports.ReportsRepositoryPrisma = ReportsRepositoryPrisma;
exports.ReportsRepositoryPrisma = ReportsRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [weekly_report_policy_1.WeeklyReportPolicy,
        prisma_service_1.PrismaService])
], ReportsRepositoryPrisma);
function toDecimal(value) {
    if (value === undefined || value === null) {
        return null;
    }
    return new client_1.Prisma.Decimal(value);
}
