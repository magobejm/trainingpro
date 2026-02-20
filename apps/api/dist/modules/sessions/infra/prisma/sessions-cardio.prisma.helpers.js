"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCardioSessionMutable = assertCardioSessionMutable;
exports.mapCardioSessionBlockCreate = mapCardioSessionBlockCreate;
exports.readFirstDayCardioBlocks = readFirstDayCardioBlocks;
exports.mapCardioIntervalLog = mapCardioIntervalLog;
exports.mapCardioSession = mapCardioSession;
exports.cardioSessionInclude = cardioSessionInclude;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function assertCardioSessionMutable(status) {
    if (status === client_1.SessionStatus.COMPLETED) {
        throw new common_1.BadRequestException('Session already completed');
    }
}
function mapCardioSessionBlockCreate(block) {
    return {
        displayName: block.displayName,
        restSeconds: block.restSeconds,
        roundsPlanned: block.roundsPlanned,
        sortOrder: block.sortOrder,
        sourceCardioBlockId: block.id,
        sourceCardioMethodId: block.cardioMethodLibraryId,
        targetDistanceMeters: block.targetDistanceMeters,
        targetRpe: block.targetRpe,
        workSeconds: block.workSeconds,
    };
}
function readFirstDayCardioBlocks(days) {
    const firstDay = days[0];
    if (!firstDay || firstDay.cardioBlocks.length === 0) {
        return null;
    }
    return firstDay.cardioBlocks;
}
function mapCardioIntervalLog(row) {
    return {
        avgHeartRate: row.avgHeartRate,
        distanceDoneMeters: row.distanceDoneMeters,
        durationSecondsDone: row.durationSecondsDone,
        effortRpe: row.effortRpe,
        intervalIndex: row.intervalIndex,
        sessionCardioBlockId: row.sessionCardioBlockId,
    };
}
function mapCardioSession(row) {
    return {
        blocks: row.cardioBlocks.map((block) => ({
            displayName: block.displayName,
            id: block.id,
            restSeconds: block.restSeconds,
            roundsPlanned: block.roundsPlanned,
            sortOrder: block.sortOrder,
            targetDistanceMeters: block.targetDistanceMeters,
            targetRpe: block.targetRpe,
            workSeconds: block.workSeconds,
        })),
        clientId: row.clientId,
        finishComment: row.finishComment,
        finishedAt: row.finishedAt,
        id: row.id,
        isCompleted: row.isCompleted,
        isIncomplete: row.isIncomplete,
        sessionDate: row.sessionDate,
        startedAt: row.startedAt,
        status: row.status,
        templateId: row.sourceTemplateId,
        templateVersion: row.sourceTemplateVersion,
    };
}
function cardioSessionInclude() {
    return {
        cardioBlocks: {
            orderBy: { sortOrder: 'asc' },
            where: { archivedAt: null },
        },
        template: {
            select: { kind: true },
        },
    };
}
