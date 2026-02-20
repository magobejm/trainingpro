"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCardioMethod = mapCardioMethod;
exports.mapExercise = mapExercise;
exports.mapFood = mapFood;
exports.mapCatalogItem = mapCatalogItem;
exports.normalizeCardioMethodInput = normalizeCardioMethodInput;
exports.normalizeExerciseInput = normalizeExerciseInput;
exports.normalizeFoodInput = normalizeFoodInput;
const client_1 = require("@prisma/client");
function mapCardioMethod(row) {
    return {
        coachMembershipId: row.coachMembershipId,
        createdAt: row.createdAt,
        description: row.description,
        id: row.id,
        media: { type: row.mediaType, url: row.mediaUrl },
        methodType: row.methodTypeRef.label,
        methodTypeId: row.methodTypeId,
        name: row.name,
        scope: toDomainScope(row.scope),
        updatedAt: row.updatedAt,
        youtubeUrl: row.youtubeUrl,
    };
}
function mapExercise(row) {
    return {
        coachMembershipId: row.coachMembershipId,
        createdAt: row.createdAt,
        equipment: row.equipment,
        id: row.id,
        instructions: row.instructions,
        media: { type: row.mediaType, url: row.mediaUrl },
        muscleGroup: row.muscleGroupRef.label,
        muscleGroupId: row.muscleGroupId,
        name: row.name,
        scope: toDomainScope(row.scope),
        updatedAt: row.updatedAt,
        youtubeUrl: row.youtubeUrl,
    };
}
function mapFood(row) {
    return {
        caloriesKcal: row.caloriesKcal,
        carbsG: row.carbsG,
        coachMembershipId: row.coachMembershipId,
        createdAt: row.createdAt,
        fatG: row.fatG,
        foodCategory: row.foodCategory,
        foodType: row.foodType,
        id: row.id,
        media: { type: row.mediaType, url: row.mediaUrl },
        name: row.name,
        notes: row.notes,
        proteinG: row.proteinG,
        scope: toDomainScope(row.scope),
        servingUnit: row.servingUnit,
        updatedAt: row.updatedAt,
    };
}
function mapCatalogItem(row) {
    return {
        id: row.id,
        isDefault: row.isDefault,
        label: row.label,
    };
}
function normalizeCardioMethodInput(input) {
    return {
        description: toNullable(input.description),
        mediaType: toNullable(input.mediaType),
        mediaUrl: toNullable(input.mediaUrl),
        methodTypeId: input.methodTypeId.trim(),
        name: input.name.trim(),
        youtubeUrl: toNullable(input.youtubeUrl),
    };
}
function normalizeExerciseInput(input) {
    return {
        equipment: toNullable(input.equipment),
        instructions: toNullable(input.instructions),
        mediaType: toNullable(input.mediaType),
        mediaUrl: toNullable(input.mediaUrl),
        muscleGroupId: input.muscleGroupId.trim(),
        name: input.name.trim(),
        youtubeUrl: toNullable(input.youtubeUrl),
    };
}
function normalizeFoodInput(input) {
    return {
        caloriesKcal: input.caloriesKcal ?? null,
        carbsG: input.carbsG ?? null,
        fatG: input.fatG ?? null,
        foodCategory: toNullable(input.foodCategory),
        foodType: normalizeFoodType(input.foodType),
        mediaType: toNullable(input.mediaType),
        mediaUrl: toNullable(input.mediaUrl),
        name: input.name.trim(),
        notes: toNullable(input.notes),
        proteinG: input.proteinG ?? null,
        servingUnit: normalizeServingUnit(input.servingUnit),
    };
}
function toDomainScope(scope) {
    return scope === client_1.LibraryItemScope.COACH ? 'coach' : 'global';
}
function toNullable(value) {
    const normalized = value?.trim();
    if (!normalized) {
        return null;
    }
    return normalized;
}
function normalizeFoodType(value) {
    const normalized = toNullable(value)?.toLowerCase();
    if (!normalized) {
        return null;
    }
    if (normalized === 'ingrediente' || normalized === 'plato') {
        return normalized;
    }
    return null;
}
function normalizeServingUnit(value) {
    const normalized = toNullable(value)?.toLowerCase();
    if (!normalized) {
        return null;
    }
    if (normalized === '100g' || normalized === '100ml' || normalized === 'porcion') {
        return normalized;
    }
    if (normalized === 'g' || normalized === 'gramos') {
        return '100g';
    }
    if (normalized === 'ml' || normalized === 'mililitros') {
        return '100ml';
    }
    if (normalized === 'unidad') {
        return 'porcion';
    }
    return null;
}
