import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { IsometricExerciseFilter, IsometricExerciseWriteInput } from '../../domain/isometric-exercise.input';
import type { PlioExerciseFilter, PlioExerciseWriteInput } from '../../domain/plio-exercise.input';
import type {
  MobilityExerciseFilter,
  MobilityExerciseWriteInput,
} from '../../domain/mobility-exercise.input';
import type { SportWriteInput } from '../../domain/sport.input';
import type { LibraryCatalogItem } from '../../domain/entities/library-catalog-item';
import { LibraryEditPolicy } from '../../domain/policies/library-edit.policy';
import {
  normalizeIsometricExerciseInput,
  normalizePlioExerciseInput,
  normalizeMobilityExerciseInput,
  normalizeSportInput,
} from './library.mappers';
import { mapIsometricExercise, mapPlioExercise, mapSport, mapMobilityExercise } from './library.specialized-mappers';
import {
  buildIsometricWhere,
  buildPlioWhere,
  buildMobilityWhere,
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

  async listIsometricExercises(context: AuthContext, filter: IsometricExerciseFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.isometricExercise.findMany({
      orderBy: [{ name: 'asc' }],
      where: buildIsometricWhere(membership.id, filter),
    });
    return rows.map(mapIsometricExercise);
  }

  async listIsometricTypes(context: AuthContext): Promise<LibraryCatalogItem[]> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.isometricExercise.findMany({
      distinct: ['isometricType'],
      orderBy: [{ isometricType: 'asc' }],
      select: { isometricType: true },
      where: buildIsometricWhere(membership.id, {}),
    });
    return mapEnumCatalog(rows.map((row) => row.isometricType ?? 'undefined'));
  }

  async createIsometricExercise(context: AuthContext, input: IsometricExerciseWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.isometricExercise.create({
      data: {
        ...normalizeIsometricExerciseInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapIsometricExercise(row);
  }

  async updateIsometricExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<IsometricExerciseWriteInput>,
  ) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readIsometricExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.isometricExercise.update({
      where: { id: itemId },
      data: normalizeIsometricExerciseInput(input),
    });
    return mapIsometricExercise(updated);
  }

  async deleteIsometricExercise(context: AuthContext, itemId: string) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readIsometricExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.isometricExercise.update({
      where: { id: itemId },
      data: { archivedAt: new Date() },
    });
  }

  async listPlioExercises(context: AuthContext, filter: PlioExerciseFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.plioExercise.findMany({
      orderBy: [{ name: 'asc' }],
      where: buildPlioWhere(membership.id, filter),
    });
    return rows.map(mapPlioExercise);
  }

  async listMobilityExercises(context: AuthContext, filter: MobilityExerciseFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.mobilityExercise.findMany({
      orderBy: [{ name: 'asc' }],
      where: buildMobilityWhere(membership.id, filter),
    });
    return rows.map(mapMobilityExercise);
  }

  async listSports(context: AuthContext, query?: string) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.sport.findMany({
      orderBy: [{ name: 'asc' }],
      where: buildSportWhere(membership.id, query),
    });
    return rows.map(mapSport);
  }

  async listPlioTypes(context: AuthContext): Promise<LibraryCatalogItem[]> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.plioExercise.findMany({
      distinct: ['plioType'],
      orderBy: [{ plioType: 'asc' }],
      select: { plioType: true },
      where: buildPlioWhere(membership.id, {}),
    });
    return mapEnumCatalog(rows.map((row) => row.plioType ?? 'undefined'));
  }

  async listMobilityTypes(context: AuthContext): Promise<LibraryCatalogItem[]> {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.mobilityExercise.findMany({
      distinct: ['mobilityType'],
      orderBy: [{ mobilityType: 'asc' }],
      select: { mobilityType: true },
      where: buildMobilityWhere(membership.id, {}),
    });
    return mapEnumCatalog(rows.map((row) => row.mobilityType ?? 'undefined'));
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

  async createMobilityExercise(context: AuthContext, input: MobilityExerciseWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.mobilityExercise.create({
      data: {
        ...normalizeMobilityExerciseInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapMobilityExercise(row);
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

  async updateMobilityExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<MobilityExerciseWriteInput>,
  ) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readMobilityExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.mobilityExercise.update({
      where: { id: itemId },
      data: normalizeMobilityExerciseInput(input),
    });
    return mapMobilityExercise(updated);
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

  async deleteMobilityExercise(context: AuthContext, itemId: string) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readMobilityExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.mobilityExercise.update({
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

  private async readIsometricExerciseForUpdate(itemId: string) {
    const row = await this.prisma.isometricExercise.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Isometric exercise not found');
    }
    return row;
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

  private async readMobilityExerciseForUpdate(itemId: string) {
    const row = await this.prisma.mobilityExercise.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Mobility exercise not found');
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

function mapEnumCatalog(rawValues: string[]): LibraryCatalogItem[] {
  const values = Array.from(new Set(['undefined', ...rawValues]))
    .filter((value) => value.trim().length > 0)
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  return values.map((value) => ({
    id: value,
    isDefault: value === 'undefined',
    label: value,
  }));
}
