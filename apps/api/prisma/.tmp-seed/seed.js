"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const v1_cardio_methods_seed_1 = require("./seeds/v1-cardio-methods.seed");
const v1_exercises_seed_1 = require("./seeds/v1-exercises.seed");
const v1_foods_seed_1 = require("./seeds/v1-foods.seed");
const prisma = new client_1.PrismaClient();
async function main() {
    await seedExercises();
    await seedCardioMethods();
    await seedFoods();
}
async function seedCardioMethods() {
    for (const item of v1_cardio_methods_seed_1.CARDIO_METHODS_V1) {
        await prisma.cardioMethod.upsert({
            where: { id: item.id },
            create: {
                id: item.id,
                methodType: item.methodType,
                name: item.name,
                scope: client_1.LibraryItemScope.GLOBAL,
            },
            update: {
                archivedAt: null,
                methodType: item.methodType,
                name: item.name,
                scope: client_1.LibraryItemScope.GLOBAL,
            },
        });
    }
}
async function seedExercises() {
    for (const item of v1_exercises_seed_1.EXERCISES_V1) {
        await prisma.exercise.upsert({
            where: { id: item.id },
            create: {
                id: item.id,
                muscleGroup: item.muscleGroup,
                name: item.name,
                scope: client_1.LibraryItemScope.GLOBAL,
            },
            update: {
                archivedAt: null,
                muscleGroup: item.muscleGroup,
                name: item.name,
                scope: client_1.LibraryItemScope.GLOBAL,
            },
        });
    }
}
async function seedFoods() {
    for (const item of v1_foods_seed_1.FOODS_V1) {
        await prisma.food.upsert({
            where: { id: item.id },
            create: {
                id: item.id,
                name: item.name,
                servingUnit: item.servingUnit,
                foodType: item.foodType,
                foodCategory: item.foodCategory,
                caloriesKcal: item.caloriesKcal,
                proteinG: item.proteinG,
                carbsG: item.carbsG,
                fatG: item.fatG,
                notes: item.notes ?? null,
                scope: client_1.LibraryItemScope.GLOBAL,
            },
            update: {
                archivedAt: null,
                name: item.name,
                servingUnit: item.servingUnit,
                foodType: item.foodType,
                foodCategory: item.foodCategory,
                caloriesKcal: item.caloriesKcal,
                proteinG: item.proteinG,
                carbsG: item.carbsG,
                fatG: item.fatG,
                notes: item.notes ?? null,
                scope: client_1.LibraryItemScope.GLOBAL,
            },
        });
    }
}
main()
    .catch((error) => {
    console.error('Library seed failed', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
