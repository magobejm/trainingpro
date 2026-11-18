import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

/** Counts active nutrition plans (library or client copies) whose content mentions the given food or meal id. */
export async function countActivePlansReferencing(db: Db, id: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ total: number }>>(Prisma.sql`
    SELECT count(*)::int AS total FROM nutrition_plan
    WHERE archived_at IS NULL AND content IS NOT NULL AND content::text LIKE ${`%${id}%`}
  `);
  return rows[0]?.total ?? 0;
}

export function nutritionInUse(what: string): ConflictException {
  return new ConflictException(`Library item is in use by ${what}`);
}

export async function assertMealNotInUse(db: Db, mealId: string): Promise<void> {
  if ((await countActivePlansReferencing(db, mealId)) > 0) throw nutritionInUse('active diets');
}

export async function assertFoodNotInUse(db: Db, foodId: string): Promise<void> {
  const meals = await db.mealIngredient.count({ where: { foodId, meal: { archivedAt: null } } });
  if (meals > 0) throw nutritionInUse('active meals');
  if ((await countActivePlansReferencing(db, foodId)) > 0) throw nutritionInUse('active diets');
}
