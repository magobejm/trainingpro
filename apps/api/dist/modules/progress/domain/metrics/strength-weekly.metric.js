"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateStrengthWeekly = aggregateStrengthWeekly;
const week_start_1 = require("./week-start");
function aggregateStrengthWeekly(rows) {
    const index = new Map();
    for (const row of rows) {
        const weekStart = (0, week_start_1.toWeekStart)(row.sessionDate);
        const key = `${weekStart}:${row.muscleGroup}`;
        const current = index.get(key) ?? {
            maxWeightKg: null,
            muscleGroup: row.muscleGroup,
            totalReps: 0,
            totalSets: 0,
            volumeKg: 0,
            weekStart,
        };
        if (row.repsDone !== null || row.weightDoneKg !== null) {
            current.totalSets += 1;
        }
        if (row.repsDone !== null) {
            current.totalReps += row.repsDone;
        }
        if (row.weightDoneKg !== null) {
            current.maxWeightKg = Math.max(current.maxWeightKg ?? 0, row.weightDoneKg);
        }
        if (row.repsDone !== null && row.weightDoneKg !== null) {
            current.volumeKg += row.repsDone * row.weightDoneKg;
        }
        index.set(key, current);
    }
    return [...index.values()].sort(sortStrength);
}
function sortStrength(a, b) {
    if (a.weekStart !== b.weekStart) {
        return a.weekStart.localeCompare(b.weekStart);
    }
    return a.muscleGroup.localeCompare(b.muscleGroup);
}
