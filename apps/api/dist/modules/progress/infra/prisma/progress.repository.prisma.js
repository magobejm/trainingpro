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
exports.ProgressRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
let ProgressRepositoryPrisma = class ProgressRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async readCardioLogs(context, query) {
        const clientId = await this.resolveClientId(context, query.clientId);
        const rows = await this.prisma.intervalLog.findMany({
            where: buildDateWhere(clientId, query),
            select: {
                avgHeartRate: true,
                distanceDoneMeters: true,
                durationSecondsDone: true,
                effortRpe: true,
                session: { select: { sessionDate: true } },
                sessionCardioBlock: { select: { sourceCardioMethodId: true } },
            },
        });
        const methodMap = await this.readMethodTypeMap(rows);
        return rows.map((row) => ({
            avgHeartRate: row.avgHeartRate,
            distanceDoneMeters: row.distanceDoneMeters,
            durationSecondsDone: row.durationSecondsDone,
            effortRpe: row.effortRpe,
            methodType: methodMap.get(row.sessionCardioBlock.sourceCardioMethodId ?? '') ?? 'UNKNOWN',
            sessionDate: row.session.sessionDate,
        }));
    }
    async readSessionSrpeRows(context, query) {
        const clientId = await this.resolveClientId(context, query.clientId);
        const sessions = await this.prisma.sessionInstance.findMany({
            where: buildSessionWhere(clientId, query),
            select: {
                finishedAt: true,
                intervalLogs: { select: { durationSecondsDone: true, effortRpe: true } },
                logs: { select: { effortRpe: true } },
                sessionDate: true,
                startedAt: true,
            },
        });
        return sessions.map((session) => ({
            durationSeconds: readDurationSeconds(session.startedAt, session.finishedAt, session.intervalLogs),
            effortRpe: readSessionEffort(session.logs, session.intervalLogs),
            sessionDate: session.sessionDate,
        }));
    }
    async readStrengthLogs(context, query) {
        const clientId = await this.resolveClientId(context, query.clientId);
        const rows = await this.prisma.setLog.findMany({
            where: buildDateWhere(clientId, query),
            select: {
                repsDone: true,
                session: { select: { sessionDate: true } },
                sessionItem: { select: { sourceExerciseId: true } },
                weightDoneKg: true,
            },
        });
        const exerciseMap = await this.readMuscleGroupMap(rows);
        return rows.map((row) => ({
            muscleGroup: exerciseMap.get(row.sessionItem.sourceExerciseId ?? '') ?? 'UNKNOWN',
            repsDone: row.repsDone,
            sessionDate: row.session.sessionDate,
            weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
        }));
    }
    async readMethodTypeMap(rows) {
        const ids = uniqueIds(rows.map((row) => row.sessionCardioBlock.sourceCardioMethodId));
        if (ids.length === 0) {
            return new Map();
        }
        const methods = await this.prisma.cardioMethod.findMany({
            where: { id: { in: ids } },
            select: { id: true, methodTypeRef: { select: { label: true } } },
        });
        return new Map(methods.map((row) => [row.id, row.methodTypeRef.label]));
    }
    async readMuscleGroupMap(rows) {
        const ids = uniqueIds(rows.map((row) => row.sessionItem.sourceExerciseId));
        if (ids.length === 0) {
            return new Map();
        }
        const exercises = await this.prisma.exercise.findMany({
            where: { id: { in: ids } },
            select: { id: true, muscleGroupRef: { select: { label: true } } },
        });
        return new Map(exercises.map((row) => [row.id, row.muscleGroupRef.label]));
    }
    async resolveClientId(context, inputClientId) {
        if (context.activeRole === 'coach') {
            if (!inputClientId) {
                throw new common_1.ForbiddenException('clientId is required for coach progress queries');
            }
            const membership = await this.readCoachMembership(context.subject);
            await this.assertCoachClient(membership.id, inputClientId);
            return inputClientId;
        }
        if (context.activeRole === 'client') {
            return this.readClientIdByEmail(context.email ?? '', inputClientId);
        }
        throw new common_1.ForbiddenException('Admin cannot access client progress');
    }
    async readCoachMembership(subject) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: { archivedAt: null, isActive: true, role: client_1.Role.COACH, user: { supabaseUid: subject } },
            select: { id: true },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Coach membership not found');
        }
        return membership;
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
    async readClientIdByEmail(email, inputClientId) {
        if (!email) {
            throw new common_1.ForbiddenException('Client email not found in auth context');
        }
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, email },
            select: { id: true },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client profile not found');
        }
        if (inputClientId && inputClientId !== client.id) {
            throw new common_1.ForbiddenException('Client cannot read progress from another profile');
        }
        return client.id;
    }
};
exports.ProgressRepositoryPrisma = ProgressRepositoryPrisma;
exports.ProgressRepositoryPrisma = ProgressRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProgressRepositoryPrisma);
function buildDateWhere(clientId, query) {
    return {
        session: {
            archivedAt: null,
            clientId,
            isCompleted: true,
            sessionDate: { gte: query.from, lte: query.to },
        },
    };
}
function buildSessionWhere(clientId, query) {
    return {
        archivedAt: null,
        clientId,
        isCompleted: true,
        sessionDate: { gte: query.from, lte: query.to },
    };
}
function uniqueIds(items) {
    return [...new Set(items.filter((item) => Boolean(item)))];
}
function readDurationSeconds(startedAt, finishedAt, intervalLogs) {
    if (startedAt && finishedAt && finishedAt > startedAt) {
        return Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
    }
    const intervalDuration = intervalLogs.reduce((sum, row) => sum + (row.durationSecondsDone ?? 0), 0);
    return intervalDuration > 0 ? intervalDuration : null;
}
function readSessionEffort(setLogs, intervalLogs) {
    const values = [...setLogs, ...intervalLogs]
        .map((row) => row.effortRpe)
        .filter((value) => value !== null);
    if (values.length === 0) {
        return null;
    }
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(avg * 100) / 100;
}
