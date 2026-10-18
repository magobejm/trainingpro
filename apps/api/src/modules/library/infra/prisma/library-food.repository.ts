import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Prisma } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { FoodFilter, FoodWriteInput } from '../../domain/food.input';
import { LibraryEditPolicy } from '../../domain/policies/library-edit.policy';
import { mapFood, normalizeFoodInput } from './library.mappers';
import { buildFoodWhere, toDomainScope } from './library.repository.prisma.helpers';
import { matchesSearch, normalizeSearch } from '../../../../common/text/normalize-search';
import { LibraryBaseRepository } from './library-base.repository';
import { completeQueryPage, queryPageWindow, type PageSlice } from '../../../../common/pagination/page-query';

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
    return rows.map(mapFood).filter((item) => matchesSearch(item.name, filter.query));
  }

  async listFoodsPage(context: AuthContext, filter: FoodFilter): Promise<PageSlice<Awaited<ReturnType<typeof mapFood>>>> {
    const membership = await this.resolveCoachMembership(context);
    const { after: cursor, take: queryTake } = queryPageWindow(filter);
    const clauses = [
      Prisma.sql`archived_at IS NULL`,
      Prisma.sql`(scope = 'GLOBAL' OR (scope = 'COACH' AND coach_membership_id = ${membership.id}::uuid))`,
    ];
    if (filter.foodCategory?.trim()) {
      clauses.push(Prisma.sql`food_category ILIKE ${containsPattern(filter.foodCategory)}`);
    }
    if (filter.foodType?.trim()) clauses.push(Prisma.sql`food_type ILIKE ${containsPattern(filter.foodType)}`);
    if (filter.servingUnit?.trim()) clauses.push(Prisma.sql`serving_unit = ${filter.servingUnit.trim()}`);
    const needle = filter.query ? normalizeSearch(filter.query) : undefined;
    if (needle) clauses.push(Prisma.sql`normalize_search(name) LIKE ${`%${needle}%`}`);
    if (cursor) {
      clauses.push(Prisma.sql`(normalize_search(name) COLLATE "C" > ${cursor.sort} COLLATE "C"
        OR (normalize_search(name) COLLATE "C" = ${cursor.sort} COLLATE "C"
          AND id::text COLLATE "C" > ${cursor.id} COLLATE "C"))`);
    }
    const take = (queryTake ?? 51) - 1;
    return this.prisma.$transaction(
      async (tx) => {
        const candidates = await tx.$queryRaw<Array<{ id: string; sort: string }>>(Prisma.sql`
        SELECT id::text AS id, normalize_search(name) AS sort
        FROM food WHERE ${Prisma.join(clauses, ' AND ')}
        ORDER BY normalize_search(name) COLLATE "C" ASC, id::text COLLATE "C" ASC
        LIMIT ${take + 1}
      `);
        const page = completeQueryPage(
          candidates,
          { limit: take },
          {
            direction: 'asc',
            id: (item) => item.id,
            sort: (item) => item.sort,
          },
        );
        const visible = page.items;
        if (!visible.length) return { items: [], nextCursor: null };
        const rows = await tx.food.findMany({ where: { id: { in: visible.map((row) => row.id) } } });
        const byId = new Map(rows.map((row) => [row.id, mapFood(row)]));
        const items = visible.flatMap(({ id }) => {
          const item = byId.get(id);
          return item ? [item] : [];
        });
        return { items, nextCursor: page.nextCursor };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
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

function containsPattern(value: string): string {
  return `%${value.trim().replace(/[\\%_]/g, '\\$&')}%`;
}
