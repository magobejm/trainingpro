import { Injectable, BadRequestException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LibrarySeedService } from './library-seed.service';

export type UnifiedCategory = 'strength' | 'cardio' | 'plio' | 'warmup' | 'sport' | 'isometric';

export interface UnifiedExerciseDto {
  category: UnifiedCategory;
  name: string;
  mediaUrl?: string;
  youtubeUrl?: string;
  instructions?: string;
  equipmentId?: string;
  muscleGroupIds?: string[];
  movementPatternId?: string;
  anatomicalPlaneId?: string;
  cardioTypeId?: string;
  plioTypeId?: string;
  mobilityTypeId?: string;
  isometricTypeId?: string;
  sportTypeId?: string;
  coachInstructions?: string;
}

type NameFilter = { contains: string; mode: 'insensitive' } | undefined;
type IdList = string[] | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

@Injectable()
export class LibraryUnifiedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seedService: LibrarySeedService,
  ) {}

  async listAllCatalogs() {
    const alpha = [{ isDefault: 'desc' as const }, { label: 'asc' as const }];
    const queries = [
      this.prisma.exerciseMuscleGroup.findMany({ orderBy: alpha }),
      this.prisma.cardioMethodType.findMany({ orderBy: alpha }),
      this.prisma.plioTypeRef.findMany({ orderBy: alpha }),
      this.prisma.mobilityTypeRef.findMany({ orderBy: alpha }),
      this.prisma.isometricTypeRef.findMany({ orderBy: alpha }),
      this.prisma.sportTypeRef.findMany({ orderBy: alpha }),
      this.prisma.exerciseEquipment.findMany({ orderBy: alpha }),
      this.prisma.movementPattern.findMany({ orderBy: alpha }),
      this.prisma.anatomicalPlane.findMany({ orderBy: alpha }),
    ];
    const r = await Promise.all(queries);
    const pick = (items: Row[]) =>
      items.map((i) => ({
        id: i.id,
        code: i.code,
        label: i.label,
        sortOrder: i.sortOrder,
        isDefault: i.isDefault,
      }));
    return {
      muscleGroups: pick(r[0] ?? []),
      cardioMethodTypes: pick(r[1] ?? []),
      plioTypes: pick(r[2] ?? []),
      mobilityTypes: pick(r[3] ?? []),
      isometricTypes: pick(r[4] ?? []),
      sportTypes: pick(r[5] ?? []),
      equipmentTypes: pick(r[6] ?? []),
      movementPatterns: pick(r[7] ?? []),
      anatomicalPlanes: pick(r[8] ?? []),
    };
  }

  async listAllExercises(filters: Record<string, string>) {
    const toArr = (v?: string) =>
      v
        ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : undefined;
    const name: NameFilter = filters.search ? { contains: filters.search, mode: 'insensitive' } : undefined;
    const mg = toArr(filters.muscleGroupIds),
      ct = toArr(filters.cardioTypeIds);
    const pt = toArr(filters.plioTypeIds),
      mt = toArr(filters.mobilityTypeIds);
    const st = toArr(filters.sportTypeIds),
      eq = toArr(filters.equipmentIds);
    const results: Row[] = [];
    const cat = filters.baseCategory;
    if (!cat || cat === 'muscleGroups') await this.fetchExercises(results, name, mg, eq);
    if (!cat || cat === 'cardioMethodTypes') await this.fetchCardio(results, name, ct, eq);
    if (!cat || cat === 'plioTypes') await this.fetchPlio(results, name, pt, eq);
    if (!cat || cat === 'mobilityTypes') await this.fetchMobility(results, name, mt);
    if (!cat || cat === 'isometricTypes') await this.fetchIsometric(results, name, toArr(filters.isometricTypeIds));
    if (!cat || cat === 'sportTypes') await this.fetchSports(results, name, st);
    return { items: results };
  }

  private async fetchExercises(res: Row[], name: NameFilter, mg: IdList, eq: IdList) {
    const data = await this.prisma.exercise.findMany({
      where: {
        archivedAt: null,
        ...(name && { name }),
        ...(mg && { muscleGroups: { some: { muscleGroupId: { in: mg } } } }),
        ...(eq && { equipmentId: { in: eq } }),
      },
      include: {
        muscleGroups: { include: { muscleGroup: true } },
        equipmentRef: true,
        movementPatternRef: true,
        anatomicalPlaneRef: true,
      },
      orderBy: { name: 'asc' },
    });
    res.push(
      ...data.map((e) => ({
        id: e.id,
        kind: 'exercise',
        name: e.name,
        mediaUrl: e.mediaUrl,
        youtubeUrl: e.youtubeUrl,
        instructions: e.instructions,
        coachInstructions: e.coachInstructions,
        equipmentId: e.equipmentId,
        movementPatternId: e.movementPatternId,
        anatomicalPlaneId: e.anatomicalPlaneId,
        equipmentRef: e.equipmentRef,
        movementPatternRef: e.movementPatternRef,
        anatomicalPlaneRef: e.anatomicalPlaneRef,
        muscleGroups: e.muscleGroups,
        tags: [...e.muscleGroups.map((m) => m.muscleGroup.label), ...(e.equipmentRef ? [e.equipmentRef.label] : [])],
        scope: e.scope,
      })),
    );
  }

  private async fetchCardio(res: Row[], name: NameFilter, ct: IdList, eq: IdList) {
    const data = await this.prisma.cardioMethod.findMany({
      where: {
        archivedAt: null,
        ...(name && { name }),
        ...(ct && { methodTypeId: { in: ct } }),
        ...(eq && { equipmentId: { in: eq } }),
      },
      include: {
        methodTypeRef: true,
        equipmentRef: true,
        movementPatternRef: true,
        anatomicalPlaneRef: true,
      },
      orderBy: { name: 'asc' },
    });
    res.push(
      ...data.map((c) => ({
        id: c.id,
        kind: 'cardio',
        name: c.name,
        mediaUrl: c.mediaUrl,
        youtubeUrl: c.youtubeUrl,
        instructions: c.description,
        coachInstructions: c.coachInstructions,
        equipmentId: c.equipmentId,
        methodTypeId: c.methodTypeId,
        movementPatternId: c.movementPatternId,
        anatomicalPlaneId: c.anatomicalPlaneId,
        methodTypeRef: c.methodTypeRef,
        equipmentRef: c.equipmentRef,
        movementPatternRef: c.movementPatternRef,
        anatomicalPlaneRef: c.anatomicalPlaneRef,
        tags: [c.methodTypeRef.label, ...(c.equipmentRef ? [c.equipmentRef.label] : [])],
        scope: c.scope,
      })),
    );
  }

  private async fetchPlio(res: Row[], name: NameFilter, pt: IdList, eq: IdList) {
    const data = await this.prisma.plioExercise.findMany({
      where: {
        archivedAt: null,
        ...(name && { name }),
        ...(pt && { plioTypeId: { in: pt } }),
        ...(eq && { equipmentId: { in: eq } }),
      },
      include: { plioTypeRef: true, equipmentRef: true, movementPatternRef: true, anatomicalPlaneRef: true },
      orderBy: { name: 'asc' },
    });
    res.push(
      ...data.map((p) => ({
        id: p.id,
        kind: 'plio',
        name: p.name,
        mediaUrl: p.mediaUrl,
        youtubeUrl: p.youtubeUrl,
        instructions: p.description,
        coachInstructions: p.coachInstructions,
        equipmentId: p.equipmentId,
        plioTypeId: p.plioTypeId,
        movementPatternId: p.movementPatternId,
        anatomicalPlaneId: p.anatomicalPlaneId,
        plioTypeRef: p.plioTypeRef,
        equipmentRef: p.equipmentRef,
        movementPatternRef: p.movementPatternRef,
        anatomicalPlaneRef: p.anatomicalPlaneRef,
        tags: [...(p.plioTypeRef ? [p.plioTypeRef.label] : []), ...(p.equipmentRef ? [p.equipmentRef.label] : [])],
        scope: p.scope,
      })),
    );
  }

  private async fetchMobility(res: Row[], name: NameFilter, mt: IdList) {
    const data = await this.prisma.mobilityExercise.findMany({
      where: { archivedAt: null, ...(name && { name }), ...(mt && { mobilityTypeId: { in: mt } }) },
      include: { mobilityTypeRefRel: true, movementPatternRef: true, anatomicalPlaneRef: true, equipmentRef: true },
      orderBy: { name: 'asc' },
    });
    res.push(
      ...data.map((w) => ({
        id: w.id,
        kind: 'warmup',
        name: w.name,
        mediaUrl: w.mediaUrl,
        youtubeUrl: w.youtubeUrl,
        instructions: w.description,
        coachInstructions: w.coachInstructions,
        equipmentId: w.equipmentId,
        mobilityTypeId: w.mobilityTypeId,
        movementPatternId: w.movementPatternId,
        anatomicalPlaneId: w.anatomicalPlaneId,
        mobilityTypeRef: w.mobilityTypeRefRel,
        equipmentRef: w.equipmentRef,
        movementPatternRef: w.movementPatternRef,
        anatomicalPlaneRef: w.anatomicalPlaneRef,
        tags: [
          ...(w.mobilityTypeRefRel ? [w.mobilityTypeRefRel.label] : []),
          ...(w.equipmentRef ? [w.equipmentRef.label] : []),
        ],
        scope: w.scope,
      })),
    );
  }

  private async fetchIsometric(res: Row[], name: NameFilter, it: IdList) {
    const data = await this.prisma.isometricExercise.findMany({
      where: {
        archivedAt: null,
        ...(name && { name }),
        ...(it && { isometricTypeId: { in: it } }),
      },
      include: { isometricTypeRef: true, equipmentRef: true, movementPatternRef: true, anatomicalPlaneRef: true },
      orderBy: { name: 'asc' },
    });
    res.push(
      ...data.map((i) => ({
        id: i.id,
        kind: 'isometric',
        name: i.name,
        mediaUrl: i.mediaUrl,
        youtubeUrl: i.youtubeUrl,
        instructions: i.description,
        coachInstructions: i.coachInstructions,
        equipmentId: i.equipmentId,
        isometricTypeId: i.isometricTypeId,
        movementPatternId: i.movementPatternId,
        anatomicalPlaneId: i.anatomicalPlaneId,
        isometricTypeRef: i.isometricTypeRef,
        equipmentRef: i.equipmentRef,
        movementPatternRef: i.movementPatternRef,
        anatomicalPlaneRef: i.anatomicalPlaneRef,
        tags: [...(i.isometricTypeRef ? [i.isometricTypeRef.label] : []), ...(i.equipmentRef ? [i.equipmentRef.label] : [])],
        scope: i.scope,
      })),
    );
  }

  private async fetchSports(res: Row[], name: NameFilter, st: IdList) {
    const data = await this.prisma.sport.findMany({
      where: { archivedAt: null, ...(name && { name }), ...(st && { sportTypeId: { in: st } }) },
      include: { sportTypeRef: true, movementPatternRef: true, anatomicalPlaneRef: true, equipmentRef: true },
      orderBy: { name: 'asc' },
    });
    res.push(
      ...data.map((s) => ({
        id: s.id,
        kind: 'sport',
        name: s.name,
        mediaUrl: s.mediaUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        youtubeUrl: (s as any).youtubeUrl,
        instructions: s.description,
        coachInstructions: s.coachInstructions,
        equipmentId: s.equipmentId,
        sportTypeId: s.sportTypeId,
        movementPatternId: s.movementPatternId,
        anatomicalPlaneId: s.anatomicalPlaneId,
        sportTypeRef: s.sportTypeRef,
        equipmentRef: s.equipmentRef,
        movementPatternRef: s.movementPatternRef,
        anatomicalPlaneRef: s.anatomicalPlaneRef,
        tags: [...(s.sportTypeRef ? [s.sportTypeRef.label] : []), ...(s.equipmentRef ? [s.equipmentRef.label] : [])],
        scope: s.scope,
      })),
    );
  }

  async createUnifiedItem(dto: UnifiedExerciseDto, authSubject: string) {
    const membership = await this.getMembership(authSubject);
    const base = {
      scope: LibraryItemScope.COACH,
      coachMembershipId: membership.id,
      organizationId: membership.organizationId,
      name: dto.name,
      mediaUrl: dto.mediaUrl ?? null,
      mediaType: dto.mediaUrl ? 'image' : null,
      youtubeUrl: dto.youtubeUrl ?? null,
    };
    switch (dto.category) {
      case 'strength':
        return this.createStrength(base, dto);
      case 'cardio':
        return this.createCardio(base, dto);
      case 'plio':
        return this.createPlio(base, dto);
      case 'warmup':
        return this.createMobility(base, dto);
      case 'isometric':
        return this.createIsometric(base, dto);
      case 'sport':
        return this.createSport(base, dto);
      default:
        throw new BadRequestException('Valid category required');
    }
  }

  private createStrength(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.exercise.create({
      data: {
        ...base,
        equipmentId: dto.equipmentId ?? null,
        movementPatternId: dto.movementPatternId ?? null,
        anatomicalPlaneId: dto.anatomicalPlaneId ?? null,
        instructions: dto.instructions ?? null,
        coachInstructions: dto.coachInstructions ?? null,
        muscleGroups: { create: (dto.muscleGroupIds ?? []).map((id) => ({ muscleGroupId: id })) },
      },
    });
  }
  private async createCardio(base: Row, dto: UnifiedExerciseDto) {
    const methodTypeId = dto.cardioTypeId ?? await this.resolveDefaultCardioMethodTypeId();
    return this.prisma.cardioMethod.create({
      data: {
        ...base,
        methodTypeId,
        equipmentId: dto.equipmentId || null,
        movementPatternId: dto.movementPatternId || null,
        anatomicalPlaneId: dto.anatomicalPlaneId || null,
        description: dto.instructions ?? null,
        coachInstructions: dto.coachInstructions ?? null,
      },
    });
  }

  private async resolveDefaultCardioMethodTypeId(): Promise<string> {
    const row = await this.prisma.cardioMethodType.findFirst({ where: { isDefault: true } });
    if (!row) throw new BadRequestException('No default cardio method type found');
    return row.id;
  }
  private createPlio(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.plioExercise.create({
      data: {
        ...base,
        plioTypeId: dto.plioTypeId!,
        equipmentId: dto.equipmentId ?? null,
        movementPatternId: dto.movementPatternId ?? null,
        anatomicalPlaneId: dto.anatomicalPlaneId ?? null,
        description: dto.instructions ?? null,
        coachInstructions: dto.coachInstructions ?? null,
      },
    });
  }
  private createMobility(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.mobilityExercise.create({
      data: {
        ...base,
        mobilityTypeId: dto.mobilityTypeId ?? null,
        movementPatternId: dto.movementPatternId ?? null,
        anatomicalPlaneId: dto.anatomicalPlaneId ?? null,
        description: dto.instructions ?? null,
        coachInstructions: dto.coachInstructions ?? null,
      },
    });
  }
  private createIsometric(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.isometricExercise.create({
      data: {
        ...base,
        isometricTypeId: dto.isometricTypeId ?? null,
        equipmentId: dto.equipmentId ?? null,
        movementPatternId: dto.movementPatternId ?? null,
        anatomicalPlaneId: dto.anatomicalPlaneId ?? null,
        description: dto.instructions ?? null,
        coachInstructions: dto.coachInstructions ?? null,
      },
    });
  }

  private createSport(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.sport.create({
      data: {
        ...base,
        sportTypeId: dto.sportTypeId!,
        movementPatternId: dto.movementPatternId ?? null,
        anatomicalPlaneId: dto.anatomicalPlaneId ?? null,
        description: dto.instructions ?? null,
        coachInstructions: dto.coachInstructions ?? null,
        icon: 'Activity',
      },
    });
  }

  async updateUnifiedItem(id: string, dto: UnifiedExerciseDto, authSubject: string) {
    const mem = await this.getMembership(authSubject);
    const base = {
      name: dto.name,
      coachMembershipId: mem.id,
      organizationId: mem.organizationId,
      ...(dto.mediaUrl !== undefined && { mediaUrl: dto.mediaUrl, mediaType: dto.mediaUrl ? 'image' : null }),
      ...(dto.youtubeUrl !== undefined && { youtubeUrl: dto.youtubeUrl }),
    };
    const extBase = {
      ...base,
      movementPatternId: dto.movementPatternId,
      anatomicalPlaneId: dto.anatomicalPlaneId,
      description: dto.instructions,
      coachInstructions: dto.coachInstructions,
    };
    switch (dto.category) {
      case 'strength':
        return this.updateStrength(id, base, dto);
      case 'cardio': {
        const methodTypeId = dto.cardioTypeId ?? await this.resolveDefaultCardioMethodTypeId();
        return this.prisma.cardioMethod.update({
          where: { id },
          data: { ...extBase, methodTypeId, equipmentId: dto.equipmentId },
        });
      }
      case 'plio':
        return this.prisma.plioExercise.update({
          where: { id },
          data: { ...extBase, plioTypeId: dto.plioTypeId!, equipmentId: dto.equipmentId },
        });
      case 'warmup':
        return this.prisma.mobilityExercise.update({
          where: { id },
          data: { ...extBase, mobilityTypeId: dto.mobilityTypeId ?? null },
        });
      case 'isometric':
        return this.prisma.isometricExercise.update({
          where: { id },
          data: { ...extBase, isometricTypeId: dto.isometricTypeId, equipmentId: dto.equipmentId },
        });
      case 'sport':
        return this.prisma.sport.update({
          where: { id },
          data: { ...extBase, sportTypeId: dto.sportTypeId! },
        });
      default:
        throw new BadRequestException('Valid category required');
    }
  }

  private async updateStrength(id: string, base: Row, dto: UnifiedExerciseDto) {
    await this.prisma.exerciseMuscleGroupAssignment.deleteMany({ where: { exerciseId: id } });
    return this.prisma.exercise.update({
      where: { id },
      data: {
        ...base,
        equipmentId: dto.equipmentId,
        movementPatternId: dto.movementPatternId,
        anatomicalPlaneId: dto.anatomicalPlaneId,
        instructions: dto.instructions,
        coachInstructions: dto.coachInstructions,
        muscleGroups: { create: (dto.muscleGroupIds ?? []).map((mgId) => ({ muscleGroupId: mgId })) },
      },
    });
  }

  async seedBiomechanics() {
    return this.seedService.seedBiomechanics();
  }

  async seedMobilityLibrary() {
    return this.seedService.seedMobilityLibrary();
  }

  async seedSportsLibrary() {
    return this.seedService.seedSportsLibrary();
  }

  private async getMembership(authSubject: string) {
    const mem = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: 'COACH', user: { supabaseUid: authSubject } },
      select: { id: true, organizationId: true },
    });
    if (!mem) throw new BadRequestException('Coach membership not found');
    return mem;
  }
}
