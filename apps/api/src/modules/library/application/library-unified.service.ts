import { Injectable, BadRequestException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type UnifiedCategory = 'strength' | 'cardio' | 'plio' | 'warmup' | 'sport';

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
  sportTypeId?: string;
}

type NameFilter = { contains: string; mode: 'insensitive' } | undefined;
type IdList = string[] | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

@Injectable()
export class LibraryUnifiedService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllCatalogs() {
    const queries = [
      this.prisma.exerciseMuscleGroup.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cardioMethodType.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.plioTypeRef.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.mobilityTypeRef.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.sportTypeRef.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.exerciseEquipment.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.movementPattern.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.anatomicalPlane.findMany({ orderBy: { sortOrder: 'asc' } }),
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
      sportTypes: pick(r[4] ?? []),
      equipmentTypes: pick(r[5] ?? []),
      movementPatterns: pick(r[6] ?? []),
      anatomicalPlanes: pick(r[7] ?? []),
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
    if (!cat || cat === 'mobilityTypes') await this.fetchWarmup(results, name, mt);
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
      include: { muscleGroups: { include: { muscleGroup: true } }, equipmentRef: true },
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
        equipmentId: e.equipmentId,
        movementPatternId: e.movementPatternId,
        anatomicalPlaneId: e.anatomicalPlaneId,
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
      include: { methodTypeRef: true, equipmentRef: true },
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
        equipmentId: c.equipmentId,
        methodTypeId: c.methodTypeId,
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
      include: { plioTypeRef: true, equipmentRef: true },
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
        equipmentId: p.equipmentId,
        plioTypeId: p.plioTypeId,
        tags: [...(p.plioTypeRef ? [p.plioTypeRef.label] : []), ...(p.equipmentRef ? [p.equipmentRef.label] : [])],
        scope: p.scope,
      })),
    );
  }

  private async fetchWarmup(res: Row[], name: NameFilter, mt: IdList) {
    const data = await this.prisma.warmupExercise.findMany({
      where: { archivedAt: null, ...(name && { name }), ...(mt && { mobilityTypeId: { in: mt } }) },
      include: { mobilityTypeRefRel: true },
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
        mobilityTypeId: w.mobilityTypeId,
        tags: [...(w.mobilityTypeRefRel ? [w.mobilityTypeRefRel.label] : [])],
        scope: w.scope,
      })),
    );
  }

  private async fetchSports(res: Row[], name: NameFilter, st: IdList) {
    const data = await this.prisma.sport.findMany({
      where: { archivedAt: null, ...(name && { name }), ...(st && { sportTypeId: { in: st } }) },
      include: { sportTypeRef: true },
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
        sportTypeId: s.sportTypeId,
        tags: [...(s.sportTypeRef ? [s.sportTypeRef.label] : [])],
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
        return this.createWarmup(base, dto);
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
        muscleGroups: { create: (dto.muscleGroupIds ?? []).map((id) => ({ muscleGroupId: id })) },
      },
    });
  }
  private createCardio(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.cardioMethod.create({
      data: {
        ...base,
        methodTypeId: dto.cardioTypeId!,
        equipmentId: dto.equipmentId ?? null,
        description: dto.instructions ?? null,
      },
    });
  }
  private createPlio(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.plioExercise.create({
      data: {
        ...base,
        plioTypeId: dto.plioTypeId!,
        equipmentId: dto.equipmentId ?? null,
        description: dto.instructions ?? null,
      },
    });
  }
  private createWarmup(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.warmupExercise.create({
      data: { ...base, mobilityTypeId: dto.mobilityTypeId!, description: dto.instructions ?? null },
    });
  }
  private createSport(base: Row, dto: UnifiedExerciseDto) {
    return this.prisma.sport.create({
      data: { ...base, sportTypeId: dto.sportTypeId!, description: dto.instructions ?? null, icon: 'Activity' },
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
    switch (dto.category) {
      case 'strength':
        return this.updateStrength(id, base, dto);
      case 'cardio':
        return this.prisma.cardioMethod.update({
          where: { id },
          data: {
            ...base,
            methodTypeId: dto.cardioTypeId!,
            equipmentId: dto.equipmentId,
            description: dto.instructions,
          },
        });
      case 'plio':
        return this.prisma.plioExercise.update({
          where: { id },
          data: {
            ...base,
            plioTypeId: dto.plioTypeId!,
            equipmentId: dto.equipmentId,
            description: dto.instructions,
          },
        });
      case 'warmup':
        return this.prisma.warmupExercise.update({
          where: { id },
          data: { ...base, mobilityTypeId: dto.mobilityTypeId!, description: dto.instructions },
        });
      case 'sport':
        return this.prisma.sport.update({
          where: { id },
          data: { ...base, sportTypeId: dto.sportTypeId!, description: dto.instructions },
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
        muscleGroups: { create: (dto.muscleGroupIds ?? []).map((mgId) => ({ muscleGroupId: mgId })) },
      },
    });
  }

  async seedBiomechanics() {
    const patterns = [
      { code: 'horizontal_push', label: 'Empuje horizontal', sortOrder: 1 },
      { code: 'vertical_push', label: 'Empuje vertical', sortOrder: 2 },
      { code: 'horizontal_pull', label: 'Tracción horizontal', sortOrder: 3 },
      { code: 'vertical_pull', label: 'Tracción vertical', sortOrder: 4 },
      { code: 'knee_dominant', label: 'Dominante de rodilla', sortOrder: 5 },
      { code: 'hip_hinge', label: 'Bisagra de cadera', sortOrder: 6 },
      { code: 'hip_thrust', label: 'Empuje de cadera', sortOrder: 7 },
      { code: 'rotation_anti', label: 'Rotación/Anti-rotación', sortOrder: 8 },
      { code: 'stabilization', label: 'Estabilización', sortOrder: 9 },
      { code: 'locomotion', label: 'Locomoción y transporte', sortOrder: 10 },
      { code: 'elbow_flexion', label: 'Flexión de codo', sortOrder: 11 },
      { code: 'elbow_extension', label: 'Extensión de codo', sortOrder: 12 },
    ];
    const planes = [
      { code: 'sagittal', label: 'Sagital', sortOrder: 1 },
      { code: 'frontal', label: 'Frontal', sortOrder: 2 },
      { code: 'transverse', label: 'Transversal', sortOrder: 3 },
    ];
    for (const p of patterns) {
      await this.prisma.movementPattern.upsert({
        where: { code: p.code },
        update: { label: p.label, sortOrder: p.sortOrder },
        create: { ...p, isDefault: false },
      });
    }
    for (const p of planes) {
      await this.prisma.anatomicalPlane.upsert({
        where: { code: p.code },
        update: { label: p.label, sortOrder: p.sortOrder },
        create: { ...p, isDefault: false },
      });
    }
    return { success: true };
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
