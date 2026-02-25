import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { PlioExerciseFilter, PlioExerciseWriteInput } from '../../domain/plio-exercise.input';
import type {
  WarmupExerciseFilter,
  WarmupExerciseWriteInput,
} from '../../domain/warmup-exercise.input';
import type { SportWriteInput } from '../../domain/sport.input';
import { LibraryEditPolicy } from '../../domain/policies/library-edit.policy';
import {
  mapPlioExercise,
  mapWarmupExercise,
  mapSport,
  normalizePlioExerciseInput,
  normalizeWarmupExerciseInput,
  normalizeSportInput,
} from './library.mappers';
import {
  buildPlioWhere,
  buildWarmupWhere,
  buildSportWhere,
  toDomainScope,
} from './library.repository.prisma.helpers';
import { LibraryBaseRepository } from './library-base.repository';

@Injectable()
export class LibrarySpecializedRepository extends LibraryBaseRepository {
  constructor(
    private readonly policy: LibraryEditPolicy,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  async listPlioExercises(context: AuthContext, filter: PlioExerciseFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.plioExercise.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      where: buildPlioWhere(membership.id, filter),
    });
    return rows.map(mapPlioExercise);
  }

  async listWarmupExercises(context: AuthContext, filter: WarmupExerciseFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.warmupExercise.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      where: buildWarmupWhere(membership.id, filter),
    });
    return rows.map(mapWarmupExercise);
  }

  async listSports(context: AuthContext, query?: string) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.sport.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      where: buildSportWhere(membership.id, query),
    });
    return rows.map(mapSport);
  }

  async createPlioExercise(context: AuthContext, input: PlioExerciseWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.plioExercise.create({
      data: {
        ...normalizePlioExerciseInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapPlioExercise(row);
  }

  async createWarmupExercise(context: AuthContext, input: WarmupExerciseWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.warmupExercise.create({
      data: {
        ...normalizeWarmupExerciseInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapWarmupExercise(row);
  }

  async createSport(context: AuthContext, input: SportWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.sport.create({
      data: {
        ...normalizeSportInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapSport(row);
  }

  async updatePlioExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<PlioExerciseWriteInput>,
  ) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readPlioExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.plioExercise.update({
      where: { id: itemId },
      data: normalizePlioExerciseInput(input),
    });
    return mapPlioExercise(updated);
  }

  async updateWarmupExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<WarmupExerciseWriteInput>,
  ) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readWarmupExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.warmupExercise.update({
      where: { id: itemId },
      data: normalizeWarmupExerciseInput(input),
    });
    return mapWarmupExercise(updated);
  }

  async updateSport(context: AuthContext, itemId: string, input: Partial<SportWriteInput>) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readSportForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.sport.update({
      where: { id: itemId },
      data: normalizeSportInput(input),
    });
    return mapSport(updated);
  }

  async deletePlioExercise(context: AuthContext, itemId: string) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readPlioExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.plioExercise.update({
      where: { id: itemId },
      data: { archivedAt: new Date() },
    });
  }

  async deleteWarmupExercise(context: AuthContext, itemId: string) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readWarmupExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.warmupExercise.update({
      where: { id: itemId },
      data: { archivedAt: new Date() },
    });
  }

  async deleteSport(context: AuthContext, itemId: string) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readSportForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.sport.update({
      where: { id: itemId },
      data: { archivedAt: new Date() },
    });
  }

  private async readPlioExerciseForUpdate(itemId: string) {
    const row = await this.prisma.plioExercise.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Plio exercise not found');
    }
    return row;
  }

  private async readWarmupExerciseForUpdate(itemId: string) {
    const row = await this.prisma.warmupExercise.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Warmup exercise not found');
    }
    return row;
  }

  private async readSportForUpdate(itemId: string) {
    const row = await this.prisma.sport.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Sport not found');
    }
    return row;
  }
}
