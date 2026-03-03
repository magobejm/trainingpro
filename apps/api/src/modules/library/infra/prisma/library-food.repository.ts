import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { FoodFilter, FoodWriteInput } from '../../domain/food.input';
import { LibraryEditPolicy } from '../../domain/policies/library-edit.policy';
import { mapFood, normalizeFoodInput } from './library.mappers';
import { buildFoodWhere, toDomainScope } from './library.repository.prisma.helpers';
import { LibraryBaseRepository } from './library-base.repository';

@Injectable()
export class LibraryFoodRepository extends LibraryBaseRepository {
  constructor(
    private readonly policy: LibraryEditPolicy,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  async createFood(context: AuthContext, input: FoodWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.food.create({
      data: {
        ...buildCreateAuditFields(context),
        ...normalizeFoodInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapFood(row);
  }

  async listFoods(context: AuthContext, filter: FoodFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.food.findMany({
      orderBy: [{ name: 'asc' }],
      where: buildFoodWhere(membership.id, filter),
    });
    return rows.map(mapFood);
  }

  async updateFood(context: AuthContext, itemId: string, input: Partial<FoodWriteInput>) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readFoodForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.food.update({
      where: { id: itemId },
      data: { ...buildUpdateAuditFields(context), ...normalizeFoodInput(input) },
    });
    return mapFood(updated);
  }

  async deleteFood(context: AuthContext, itemId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readFoodForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.food.update({
      where: { id: itemId },
      data: {
        ...buildUpdateAuditFields(context),
        archivedAt: new Date(),
      },
    });
  }

  private async readFoodForUpdate(itemId: string) {
    const row = await this.prisma.food.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Food not found');
    }
    return row;
  }
}
