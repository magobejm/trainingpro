"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertPlanTemplateDto = void 0;
const zod_1 = require("zod");
const nullableNumber = zod_1.z.number().min(0).max(5000).nullable().optional();
const perSetRangeSchema = zod_1.z.object({
    maxKg: nullableNumber,
    minKg: nullableNumber,
});
const fieldModeSchema = zod_1.z.object({
    fieldKey: zod_1.z.string().trim().min(1).max(80),
    mode: zod_1.z.enum(['HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT']),
});
const exerciseSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().min(1).max(120),
    exerciseLibraryId: zod_1.z.string().uuid().nullable().optional(),
    fieldModes: zod_1.z.array(fieldModeSchema).min(1),
    notes: zod_1.z.string().max(2000).nullable().optional(),
    perSetWeightRanges: zod_1.z.array(perSetRangeSchema).optional(),
    repsMax: zod_1.z.number().int().min(1).max(100).nullable().optional(),
    repsMin: zod_1.z.number().int().min(1).max(100).nullable().optional(),
    setsPlanned: zod_1.z.number().int().min(1).max(30).nullable().optional(),
    sortOrder: zod_1.z.number().int().min(0).max(200),
    weightRangeMaxKg: nullableNumber,
    weightRangeMinKg: nullableNumber,
});
const daySchema = zod_1.z.object({
    dayIndex: zod_1.z.number().int().min(1).max(14),
    exercises: zod_1.z.array(exerciseSchema).min(1),
    title: zod_1.z.string().trim().min(1).max(120),
});
class UpsertPlanTemplateDto {
    static schema = zod_1.z.object({
        days: zod_1.z.array(daySchema).min(1),
        name: zod_1.z.string().trim().min(1).max(120),
    });
    days;
    name;
}
exports.UpsertPlanTemplateDto = UpsertPlanTemplateDto;
