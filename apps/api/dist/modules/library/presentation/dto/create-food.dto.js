"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFoodDto = void 0;
const zod_1 = require("zod");
const macroSchema = zod_1.z.number().int().min(0).max(2000).nullable().optional();
const servingUnitSchema = zod_1.z.enum(['100g', '100ml', 'porcion']);
const foodTypeSchema = zod_1.z.enum(['ingrediente', 'plato']).nullable().optional();
class CreateFoodDto {
    static schema = zod_1.z.object({
        caloriesKcal: macroSchema,
        carbsG: macroSchema,
        fatG: macroSchema,
        foodCategory: zod_1.z.string().trim().max(80).nullable().optional(),
        foodType: foodTypeSchema,
        mediaType: zod_1.z.string().max(40).nullable().optional(),
        mediaUrl: zod_1.z.string().url().max(500).nullable().optional(),
        name: zod_1.z.string().trim().min(1).max(120),
        notes: zod_1.z.string().max(2000).nullable().optional(),
        proteinG: macroSchema,
        servingUnit: servingUnitSchema,
    }).superRefine((value, ctx) => {
        if (value.servingUnit === 'porcion' && !value.notes?.trim()) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Notes are required when servingUnit is porcion',
                path: ['notes'],
            });
        }
    });
    caloriesKcal;
    carbsG;
    fatG;
    foodCategory;
    foodType;
    mediaType;
    mediaUrl;
    name;
    notes;
    proteinG;
    servingUnit;
}
exports.CreateFoodDto = CreateFoodDto;
