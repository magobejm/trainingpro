"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateCardioWeekly = aggregateCardioWeekly;
const week_start_1 = require("./week-start");
function aggregateCardioWeekly(rows) {
    const index = new Map();
    for (const row of rows) {
        const weekStart = (0, week_start_1.toWeekStart)(row.sessionDate);
        const key = `${weekStart}:${row.methodType}`;
        const current = index.get(key) ?? createAccumulator(row.methodType, weekStart);
        current.totalDurationSeconds += row.durationSecondsDone ?? 0;
        current.totalDistanceMeters += row.distanceDoneMeters ?? 0;
        if (row.effortRpe !== null) {
            current.avgRpeSum += row.effortRpe;
            current.avgRpeTotal += 1;
        }
        if (row.avgHeartRate !== null) {
            current.avgHeartRateSum += row.avgHeartRate;
            current.avgHeartRateTotal += 1;
        }
        index.set(key, current);
    }
    return [...index.values()].map(toOutput).sort(sortCardio);
}
function createAccumulator(methodType, weekStart) {
    return {
        avgHeartRate: null,
        avgHeartRateSum: 0,
        avgHeartRateTotal: 0,
        avgRpe: null,
        avgRpeSum: 0,
        avgRpeTotal: 0,
        methodType,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        weekStart,
    };
}
function toOutput(row) {
    const avgHeartRate = row.avgHeartRateTotal > 0 ? round(row.avgHeartRateSum / row.avgHeartRateTotal) : null;
    const avgRpe = row.avgRpeTotal > 0 ? round(row.avgRpeSum / row.avgRpeTotal) : null;
    return {
        avgHeartRate,
        avgRpe,
        methodType: row.methodType,
        totalDistanceMeters: row.totalDistanceMeters,
        totalDurationSeconds: row.totalDurationSeconds,
        weekStart: row.weekStart,
    };
}
function sortCardio(a, b) {
    if (a.weekStart !== b.weekStart) {
        return a.weekStart.localeCompare(b.weekStart);
    }
    return a.methodType.localeCompare(b.methodType);
}
function round(value) {
    return Math.round(value * 100) / 100;
}
