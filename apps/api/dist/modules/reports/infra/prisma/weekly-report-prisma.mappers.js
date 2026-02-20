"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapWeeklyReport = mapWeeklyReport;
function mapWeeklyReport(row) {
    return {
        adherencePercent: row.adherencePercent,
        energy: row.energy,
        id: row.id,
        mood: row.mood,
        notes: row.notes,
        reportDate: row.reportDate,
        sleepHours: row.sleepHours ? row.sleepHours.toNumber() : null,
        sourceSessionId: row.sourceSessionId,
        weekStartDate: row.weekStartDate,
    };
}
