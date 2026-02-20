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
exports.ExportWeeklyPdfUseCase = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const cardio_weekly_metric_1 = require("../../../progress/domain/metrics/cardio-weekly.metric");
const srpe_1 = require("../../../progress/domain/metrics/srpe");
const strength_weekly_metric_1 = require("../../../progress/domain/metrics/strength-weekly.metric");
const simple_pdf_builder_1 = require("../../infra/pdf/simple-pdf.builder");
let ExportWeeklyPdfUseCase = class ExportWeeklyPdfUseCase {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(context, input) {
        const coach = await this.resolveCoach(context);
        await this.assertClientOwnership(coach.id, input.clientId);
        const [weeklyReports, strengthRows, cardioRows, srpeRows] = await Promise.all([
            this.readWeeklyReports(input.clientId, input.from, input.to),
            this.readStrengthRows(input.clientId, input.from, input.to),
            this.readCardioRows(input.clientId, input.from, input.to),
            this.readSrpeRows(input.clientId, input.from, input.to),
        ]);
        const lines = buildLines({ cardioRows, srpeRows, strengthRows, weeklyReports }, input);
        return {
            data: (0, simple_pdf_builder_1.buildSimplePdf)(lines),
            fileName: `report-${input.clientId}-${toDateKey(input.to)}.pdf`,
        };
    }
    async resolveCoach(context) {
        if (context.activeRole !== 'coach') {
            throw new common_1.ForbiddenException('Only coach can export report PDF');
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
        return membership;
    }
    async assertClientOwnership(coachMembershipId, clientId) {
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, coachMembershipId, id: clientId },
            select: { id: true },
        });
        if (!client) {
            throw new common_1.ForbiddenException('Client does not belong to coach');
        }
    }
    readWeeklyReports(clientId, from, to) {
        return this.prisma.weeklyReport.findMany({
            where: { clientId, reportDate: { gte: from, lte: to } },
            orderBy: { reportDate: 'asc' },
            select: {
                adherencePercent: true,
                energy: true,
                mood: true,
                reportDate: true,
                sleepHours: true,
            },
        });
    }
    async readStrengthRows(clientId, from, to) {
        const rows = await this.prisma.setLog.findMany({
            where: buildDateWhere(clientId, from, to),
            select: {
                repsDone: true,
                session: { select: { sessionDate: true } },
                sessionItem: { select: { sourceExerciseId: true } },
                weightDoneKg: true,
            },
        });
        const map = await this.readMuscleGroupMap(rows.map((row) => row.sessionItem.sourceExerciseId));
        return rows.map((row) => ({
            muscleGroup: map.get(row.sessionItem.sourceExerciseId ?? '') ?? 'UNKNOWN',
            repsDone: row.repsDone,
            sessionDate: row.session.sessionDate,
            weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
        }));
    }
    async readCardioRows(clientId, from, to) {
        const rows = await this.prisma.intervalLog.findMany({
            where: buildDateWhere(clientId, from, to),
            select: {
                avgHeartRate: true,
                distanceDoneMeters: true,
                durationSecondsDone: true,
                effortRpe: true,
                session: { select: { sessionDate: true } },
                sessionCardioBlock: { select: { sourceCardioMethodId: true } },
            },
        });
        const map = await this.readMethodTypeMap(rows.map((row) => row.sessionCardioBlock.sourceCardioMethodId));
        return rows.map((row) => ({
            avgHeartRate: row.avgHeartRate,
            distanceDoneMeters: row.distanceDoneMeters,
            durationSecondsDone: row.durationSecondsDone,
            effortRpe: row.effortRpe,
            methodType: map.get(row.sessionCardioBlock.sourceCardioMethodId ?? '') ?? 'UNKNOWN',
            sessionDate: row.session.sessionDate,
        }));
    }
    async readSrpeRows(clientId, from, to) {
        const rows = await this.prisma.sessionInstance.findMany({
            where: {
                archivedAt: null,
                clientId,
                isCompleted: true,
                sessionDate: { gte: from, lte: to },
            },
            select: {
                finishedAt: true,
                intervalLogs: { select: { durationSecondsDone: true, effortRpe: true } },
                logs: { select: { effortRpe: true } },
                sessionDate: true,
                startedAt: true,
            },
        });
        return rows.map((row) => ({
            durationSeconds: readDurationSeconds(row.startedAt, row.finishedAt, row.intervalLogs),
            effortRpe: readSessionEffort(row.logs, row.intervalLogs),
            sessionDate: row.sessionDate,
        }));
    }
    async readMethodTypeMap(ids) {
        const unique = uniqueIds(ids);
        if (unique.length === 0) {
            return new Map();
        }
        const methods = await this.prisma.cardioMethod.findMany({
            where: { id: { in: unique } },
            select: { id: true, methodTypeRef: { select: { label: true } } },
        });
        return new Map(methods.map((row) => [row.id, row.methodTypeRef.label]));
    }
    async readMuscleGroupMap(ids) {
        const unique = uniqueIds(ids);
        if (unique.length === 0) {
            return new Map();
        }
        const exercises = await this.prisma.exercise.findMany({
            where: { id: { in: unique } },
            select: { id: true, muscleGroupRef: { select: { label: true } } },
        });
        return new Map(exercises.map((row) => [row.id, row.muscleGroupRef.label]));
    }
};
exports.ExportWeeklyPdfUseCase = ExportWeeklyPdfUseCase;
exports.ExportWeeklyPdfUseCase = ExportWeeklyPdfUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportWeeklyPdfUseCase);
function buildDateWhere(clientId, from, to) {
    return {
        session: {
            archivedAt: null,
            clientId,
            isCompleted: true,
            sessionDate: { gte: from, lte: to },
        },
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
function buildLines(data, input) {
    const strengthWeekly = (0, strength_weekly_metric_1.aggregateStrengthWeekly)(data.strengthRows);
    const cardioWeekly = (0, cardio_weekly_metric_1.aggregateCardioWeekly)(data.cardioRows);
    const srpeWeekly = (0, srpe_1.aggregateSrpeWeekly)(data.srpeRows);
    const lines = createHeaderLines(input);
    appendWeeklyReportLines(lines, data.weeklyReports);
    appendStrengthLines(lines, strengthWeekly);
    appendCardioLines(lines, cardioWeekly);
    appendSrpeLines(lines, srpeWeekly);
    return lines;
}
function createHeaderLines(input) {
    return [
        'Trainer Pro - Reporte PDF',
        `Cliente: ${input.clientId}`,
        `Rango: ${toDateKey(input.from)} a ${toDateKey(input.to)}`,
        '--- Resumen semanal ---',
    ];
}
function appendWeeklyReportLines(lines, reports) {
    for (const report of reports.slice(0, 6)) {
        lines.push(buildWeeklyReportLine(report));
    }
}
function buildWeeklyReportLine(report) {
    const left = `${toDateKey(report.reportDate)} mood:${valueOrDash(report.mood)}`;
    const middle = `energy:${valueOrDash(report.energy)} sleep:${valueOrDash(report.sleepHours)}`;
    const right = `adherence:${valueOrDash(report.adherencePercent)}`;
    return `${left} ${middle} ${right}`;
}
function appendStrengthLines(lines, points) {
    lines.push('--- Progreso fuerza ---');
    for (const point of points.slice(0, 8)) {
        lines.push(`${point.weekStart} ${point.muscleGroup} volume:${Math.round(point.volumeKg)}`);
    }
}
function appendCardioLines(lines, points) {
    lines.push('--- Progreso cardio ---');
    for (const point of points.slice(0, 8)) {
        lines.push(buildCardioLine(point));
    }
}
function buildCardioLine(point) {
    const minutes = Math.round(point.totalDurationSeconds / 60);
    return `${point.weekStart} ${point.methodType} min:${minutes}`;
}
function appendSrpeLines(lines, points) {
    lines.push('--- Intensidad sRPE ---');
    for (const point of points.slice(0, 8)) {
        lines.push(`${point.weekStart} srpe:${Math.round(point.totalSrpe)}`);
    }
}
function toDateKey(input) {
    return input.toISOString().slice(0, 10);
}
function valueOrDash(value) {
    if (value === null || value === undefined) {
        return '-';
    }
    return `${value}`;
}
