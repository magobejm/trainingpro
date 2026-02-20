"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertCardioTemplateDto = void 0;
const zod_1 = require("zod");
const nullableNumber = zod_1.z.number().int().min(0).max(200000).nullable().optional();
const fieldModeSchema = zod_1.z.object({
    fieldKey: zod_1.z.string().trim().min(1).max(80),
    mode: zod_1.z.enum(['HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT']),
});
const cardioBlockSchema = zod_1.z.object({
    cardioMethodLibraryId: zod_1.z.string().uuid().nullable().optional(),
    displayName: zod_1.z.string().trim().min(1).max(120),
    fieldModes: zod_1.z.array(fieldModeSchema).min(1),
    methodType: zod_1.z.string().trim().max(80).nullable().optional(),
    notes: zod_1.z.string().max(2000).nullable().optional(),
    restSeconds: zod_1.z.number().int().min(0).max(7200).optional(),
    roundsPlanned: zod_1.z.number().int().min(1).max(100).optional(),
    sortOrder: zod_1.z.number().int().min(0).max(200),
    targetDistanceMeters: nullableNumber,
    targetRpe: zod_1.z.number().int().min(1).max(10).nullable().optional(),
    workSeconds: zod_1.z.number().int().min(1).max(7200),
});
const daySchema = zod_1.z.object({
    cardioBlocks: zod_1.z.array(cardioBlockSchema).min(1),
    dayIndex: zod_1.z.number().int().min(1).max(14),
    title: zod_1.z.string().trim().min(1).max(120),
});
class UpsertCardioTemplateDto {
    static schema = zod_1.z.object({
        days: zod_1.z.array(daySchema).min(1),
        name: zod_1.z.string().trim().min(1).max(120),
    });
    days;
    name;
}
exports.UpsertCardioTemplateDto = UpsertCardioTemplateDto;
