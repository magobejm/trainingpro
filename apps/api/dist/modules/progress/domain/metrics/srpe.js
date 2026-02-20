"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateSrpeWeekly = aggregateSrpeWeekly;
exports.computeSessionSrpe = computeSessionSrpe;
const week_start_1 = require("./week-start");
function aggregateSrpeWeekly(rows) {
    const index = new Map();
    for (const row of rows) {
        const weekStart = (0, week_start_1.toWeekStart)(row.sessionDate);
        const current = index.get(weekStart) ?? { totalSrpe: 0, weekStart };
        current.totalSrpe += computeSessionSrpe(row.effortRpe, row.durationSeconds);
        index.set(weekStart, current);
    }
    return [...index.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
function computeSessionSrpe(effortRpe, durationSeconds) {
    if (effortRpe === null || durationSeconds === null) {
        return 0;
    }
    if (durationSeconds <= 0 || effortRpe <= 0) {
        return 0;
    }
    const durationMinutes = durationSeconds / 60;
    return Math.round(effortRpe * durationMinutes * 100) / 100;
}
