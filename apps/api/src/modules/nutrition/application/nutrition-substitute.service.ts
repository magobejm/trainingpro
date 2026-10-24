import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, type Prisma } from '@prisma/client';
import { rankSubstitutes, type FoodMacroSource } from '@trainerpro/shared';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class NutritionSubstituteService {
  constructor(private readonly prisma: PrismaService) {}

  async list(context: AuthContext, foodId: string, grams: number) {
    const client = await this.prisma.client.findFirst({
      select: { coachMembershipId: true },
      where: { archivedAt: null, email: context.email ?? '' },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    const visible = visibleFoods(client.coachMembershipId);
    const source = await this.prisma.food.findFirst({
      where: { ...visible, id: foodId },
    });
    if (!source?.foodCategory) return { items: [] };
    const foods = await this.prisma.food.findMany({
      take: 40,
      where: { ...visible, foodCategory: source.foodCategory },
    });
    return { items: rankSubstitutes(toSource(source), grams, foods.map(toSource)) };
  }
}

function visibleFoods(coachMembershipId: string | null): Prisma.FoodWhereInput {
  const own = coachMembershipId ? [{ coachMembershipId }] : [];
  return { archivedAt: null, OR: [...own, { scope: LibraryItemScope.GLOBAL }] };
}

function toSource(food: {
  caloriesKcal: number | null;
  carbsG: number | null;
  fatG: number | null;
  id: string;
  name: string;
  proteinG: number | null;
  servingUnit: string | null;
}): FoodMacroSource {
  return food;
}
