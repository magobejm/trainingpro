"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSessionMutable = assertSessionMutable;
exports.mapSessionItemCreate = mapSessionItemCreate;
exports.readFirstDayExercises = readFirstDayExercises;
exports.mapSetLog = mapSetLog;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function assertSessionMutable(status) {
    if (status === client_1.SessionStatus.COMPLETED) {
        throw new common_1.BadRequestException('Session already completed');
    }
}
function mapSessionItemCreate(item) {
    return {
        displayName: item.displayName,
        perSetRangesJson: toInputJson(item.perSetWeightRangesJson),
        repsMax: item.repsMax,
        repsMin: item.repsMin,
        setsPlanned: item.setsPlanned,
        sortOrder: item.sortOrder,
        sourceExerciseId: item.exerciseLibraryId,
        weightRangeMaxKg: item.weightRangeMaxKg,
        weightRangeMinKg: item.weightRangeMinKg,
    };
}
function readFirstDayExercises(days) {
    const firstDay = days[0];
    if (!firstDay || firstDay.exercises.length === 0) {
        return null;
    }
    return firstDay.exercises;
}
function mapSetLog(row) {
    return {
        effortRpe: row.effortRpe,
        repsDone: row.repsDone,
        sessionItemId: row.sessionItemId,
        setIndex: row.setIndex,
        weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
    };
}
function toInputJson(value) {
    if (value === null) {
        return client_1.Prisma.JsonNull;
    }
    return value;
}
