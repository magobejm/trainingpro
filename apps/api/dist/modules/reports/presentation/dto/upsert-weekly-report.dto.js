"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertWeeklyReportDto = void 0;
const zod_1 = require("zod");
class UpsertWeeklyReportDto {
    static schema = zod_1.z.object({
        adherencePercent: zod_1.z.number().min(0).max(100).nullable().optional(),
        energy: zod_1.z.number().min(1).max(10).nullable().optional(),
        mood: zod_1.z.number().min(1).max(10).nullable().optional(),
        notes: zod_1.z.string().max(1200).nullable().optional(),
        reportDate: zod_1.z.string().date(),
        sleepHours: zod_1.z.number().min(0).max(24).nullable().optional(),
        sourceSessionId: zod_1.z.string().uuid().nullable().optional(),
    });
    adherencePercent;
    energy;
    mood;
    notes;
    reportDate;
    sleepHours;
    sourceSessionId;
}
exports.UpsertWeeklyReportDto = UpsertWeeklyReportDto;
