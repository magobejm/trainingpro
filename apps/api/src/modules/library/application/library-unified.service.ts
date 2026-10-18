import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
/* eslint-disable max-lines */
import { LibraryItemScope, Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { matchesSearch, normalizeSearch } from '../../../common/text/normalize-search';
import { completeQueryPage, pageFieldsSchema, queryPageWindow, withNextCursor } from '../../../common/pagination/page-query';
import { coachOrGlobal } from '../domain/library-scope';
import { LibrarySeedService } from './library-seed.service';
import { updateStrengthExercise } from './library-unified.update';

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

type IdList = string[] | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function parseIds(value?: string): string[] | undefined {
  return value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

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

  async listAllExercises(subject: string, filters: Record<string, string>) {
    const coachMembershipId = await this.readCoachMembershipId(subject);
    const toArr = (v?: string) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const mg = toArr(filters.muscleGroupIds),
      ct = toArr(filters.cardioTypeIds);
    const pt = toArr(filters.plioTypeIds),
      mt = toArr(filters.mobilityTypeIds);
    const st = toArr(filters.sportTypeIds),
      eq = toArr(filters.equipmentIds);
    const pageQuery = z.object(pageFieldsSchema).parse({ cursor: filters.cursor, limit: filters.limit });
    if (pageQuery.limit) {
      return this.listExercisePage(coachMembershipId, filters, { mg, ct, pt, mt, st, eq }, pageQuery);
    }
    const results: Row[] = [];
    const cat = filters.baseCategory;
    if (!cat || cat === 'muscleGroups') await this.fetchExercises(results, mg, eq, coachMembershipId);
    if (!cat || cat === 'cardioMethodTypes') await this.fetchCardio(results, ct, eq, coachMembershipId);
    if (!cat || cat === 'plioTypes') await this.fetchPlio(results, pt, eq, coachMembershipId);
    if (!cat || cat === 'mobilityTypes') await this.fetchMobility(results, mt, coachMembershipId);
    if (!cat || cat === 'isometricTypes')
      await this.fetchIsometric(results, toArr(filters.isometricTypeIds), coachMembershipId);
    if (!cat || cat === 'sportTypes') await this.fetchSports(results, st, coachMembershipId);
    const filtered = results.filter((row) => matchesSearch(row.name, filters.search));
    return withNextCursor({ items: filtered }, undefined);
  }

  private async listExercisePage(
    coachMembershipId: string,
    filters: Record<string, string>,
    ids: { mg?: string[]; ct?: string[]; pt?: string[]; mt?: string[]; st?: string[]; eq?: string[] },
    page: { cursor?: string; limit?: number },
  ) {
    const parts = this.exercisePageParts(coachMembershipId, filters, ids);
    if (!parts.length) return { items: [], nextCursor: null };
    const clauses = this.exercisePageClauses(filters, page);
    const where = clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty;
    const { take } = queryPageWindow(page);
    const candidates = await this.prisma.$queryRaw<Array<{ id: string; sort: string; kind: string }>>(Prisma.sql`
      WITH all_items AS (${Prisma.join(parts, ' UNION ALL ')})
      SELECT id::text AS id, sort, kind FROM all_items ${where}
      ORDER BY sort COLLATE "C" ASC, id::text COLLATE "C" ASC, kind COLLATE "C" ASC
      LIMIT ${take!}
    `);
    const candidatePage = completeQueryPage(candidates, page, {
      direction: 'asc',
      id: (item) => `${item.id}:${item.kind}`,
      sort: (item) => item.sort,
    });
    return this.hydrateExercisePage(candidatePage.items, candidatePage.nextCursor, coachMembershipId, ids, filters);
  }

  private exercisePageParts(
    coachMembershipId: string,
    filters: Record<string, string>,
    ids: { mg?: string[]; ct?: string[]; pt?: string[]; mt?: string[]; st?: string[]; eq?: string[] },
  ): Prisma.Sql[] {
    const parts: Prisma.Sql[] = [];
    const scope = Prisma.sql`archived_at IS NULL AND (
      scope = 'GLOBAL' OR (scope = 'COACH' AND coach_membership_id = ${coachMembershipId}::uuid)
    )`;
    const inIds = (column: string, values?: string[]) =>
      values?.length
        ? Prisma.sql`AND ${Prisma.raw(column)} IN (${Prisma.join(values.map((id) => Prisma.sql`${id}::uuid`))})`
        : Prisma.empty;
    const selected = (key: string) => !filters.baseCategory || filters.baseCategory === key;
    if (selected('muscleGroups'))
      parts.push(Prisma.sql`
      SELECT e.id, normalize_search(e.name) AS sort, 'exercise'::text AS kind
      FROM exercise e WHERE ${scope} ${inIds('e.equipment_id', ids.eq)}
      ${
        ids.mg?.length
          ? Prisma.sql`AND EXISTS (
        SELECT 1 FROM exercise_muscle_group_assignment m WHERE m.exercise_id = e.id
        AND m.muscle_group_id IN (${Prisma.join(ids.mg.map((id) => Prisma.sql`${id}::uuid`))})
      )`
          : Prisma.empty
      }`);
    if (selected('cardioMethodTypes'))
      parts.push(Prisma.sql`
      SELECT e.id, normalize_search(e.name) AS sort, 'cardio'::text AS kind
      FROM cardio_method e WHERE ${scope} ${inIds('e.equipment_id', ids.eq)} ${inIds('e.method_type_id', ids.ct)}
    `);
    if (selected('plioTypes'))
      parts.push(Prisma.sql`
      SELECT e.id, normalize_search(e.name) AS sort, 'plio'::text AS kind
      FROM plio_exercise e WHERE ${scope} ${inIds('e.equipment_id', ids.eq)} ${inIds('e.plio_type_id', ids.pt)}
    `);
    if (selected('mobilityTypes'))
      parts.push(Prisma.sql`
      SELECT e.id, normalize_search(e.name) AS sort, 'warmup'::text AS kind
      FROM mobility_exercise e WHERE ${scope} ${inIds('e.mobility_type_id', ids.mt)}
    `);
    if (selected('isometricTypes'))
      parts.push(Prisma.sql`
      SELECT e.id, normalize_search(e.name) AS sort, 'isometric'::text AS kind
      FROM isometric_exercise e WHERE ${scope} ${inIds('e.isometric_type_id', parseIds(filters.isometricTypeIds))}
    `);
    if (selected('sportTypes'))
      parts.push(Prisma.sql`
      SELECT e.id, normalize_search(e.name) AS sort, 'sport'::text AS kind
      FROM sport e WHERE ${scope} ${inIds('e.sport_type_id', ids.st)}
    `);
    return parts;
  }

  private exercisePageClauses(filters: Record<string, string>, page: { cursor?: string; limit?: number }): Prisma.Sql[] {
    const clauses: Prisma.Sql[] = [];
    const needle = filters.search ? normalizeSearch(filters.search) : undefined;
    if (needle) clauses.push(Prisma.sql`sort LIKE ${`%${needle}%`}`);
    const { after: cursor } = queryPageWindow(page);
    if (cursor) {
      const separator = cursor.id.lastIndexOf(':');
      const cursorKind = separator >= 0 ? cursor.id.slice(separator + 1) : null;
      const cursorId = separator >= 0 ? cursor.id.slice(0, separator) : cursor.id;
      clauses.push(
        cursorKind
          ? Prisma.sql`(
            sort COLLATE "C" > ${cursor.sort} COLLATE "C" OR
            (sort COLLATE "C" = ${cursor.sort} COLLATE "C" AND
              (id::text COLLATE "C", kind COLLATE "C") > (${cursorId} COLLATE "C", ${cursorKind} COLLATE "C"))
          )`
          : Prisma.sql`(
            sort COLLATE "C" > ${cursor.sort} COLLATE "C" OR
            (sort COLLATE "C" = ${cursor.sort} COLLATE "C" AND id::text COLLATE "C" > ${cursor.id} COLLATE "C")
          )`,
      );
    }
    return clauses;
  }

  private async hydrateExercisePage(
    visible: Array<{ id: string; sort: string; kind: string }>,
    nextCursor: string | null | undefined,
    coachMembershipId: string,
    ids: { mg?: string[]; ct?: string[]; pt?: string[]; mt?: string[]; st?: string[]; eq?: string[] },
    filters: Record<string, string>,
  ) {
    const byKind = new Map<string, string[]>();
    for (const row of visible) byKind.set(row.kind, [...(byKind.get(row.kind) ?? []), row.id]);
    const result: Row[] = [];
    await Promise.all([
      byKind.has('exercise') && this.fetchExercises(result, ids.mg, ids.eq, coachMembershipId, byKind.get('exercise')),
      byKind.has('cardio') && this.fetchCardio(result, ids.ct, ids.eq, coachMembershipId, byKind.get('cardio')),
      byKind.has('plio') && this.fetchPlio(result, ids.pt, ids.eq, coachMembershipId, byKind.get('plio')),
      byKind.has('warmup') && this.fetchMobility(result, ids.mt, coachMembershipId, byKind.get('warmup')),
      byKind.has('isometric') &&
        this.fetchIsometric(result, parseIds(filters.isometricTypeIds), coachMembershipId, byKind.get('isometric')),
      byKind.has('sport') && this.fetchSports(result, ids.st, coachMembershipId, byKind.get('sport')),
    ]);
    const byKey = new Map(result.map((row) => [`${row.kind}:${row.id}`, row]));
    const items = visible.flatMap(({ id, kind }) => {
      const item = byKey.get(`${kind}:${id}`);
      return item ? [item] : [];
    });
    return {
      items,
      nextCursor: nextCursor ?? null,
    };
  }

  private async readCoachMembershipId(subject: string): Promise<string> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    return membership.id;
  }

  private async fetchExercises(res: Row[], mg: IdList, eq: IdList, coachMembershipId: string, ids?: string[]) {
    const data = await this.prisma.exercise.findMany({
      where: {
        ...coachOrGlobal(coachMembershipId),
        ...(ids && { id: { in: ids } }),
        ...(mg && { muscleGroups: { some: { muscleGroupId: { in: mg } } } }),
        ...(eq && { equipmentId: { in: eq } }),
      },
      select: {
        anatomicalPlaneId: true,
        anatomicalPlaneRef: { select: { id: true, label: true } },
        coachInstructions: true,
        equipmentId: true,
        equipmentRef: { select: { id: true, label: true } },
        id: true,
        instructions: true,
        mediaUrl: true,
        movementPatternId: true,
        movementPatternRef: { select: { id: true, label: true } },
        muscleGroups: { select: { muscleGroupId: true, muscleGroup: { select: { label: true } } } },
        name: true,
        scope: true,
        youtubeUrl: true,
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

  private async fetchCardio(res: Row[], ct: IdList, eq: IdList, coachMembershipId: string, ids?: string[]) {
    const data = await this.prisma.cardioMethod.findMany({
      where: {
        ...coachOrGlobal(coachMembershipId),
        ...(ids && { id: { in: ids } }),
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

  private async fetchPlio(res: Row[], pt: IdList, eq: IdList, coachMembershipId: string, ids?: string[]) {
    const data = await this.prisma.plioExercise.findMany({
      where: {
        ...coachOrGlobal(coachMembershipId),
        ...(ids && { id: { in: ids } }),
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

  private async fetchMobility(res: Row[], mt: IdList, coachMembershipId: string, ids?: string[]) {
    const data = await this.prisma.mobilityExercise.findMany({
      where: {
        ...coachOrGlobal(coachMembershipId),
        ...(ids && { id: { in: ids } }),
        ...(mt && { mobilityTypeId: { in: mt } }),
      },
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

  private async fetchIsometric(res: Row[], it: IdList, coachMembershipId: string, ids?: string[]) {
    const data = await this.prisma.isometricExercise.findMany({
      where: {
        ...coachOrGlobal(coachMembershipId),
        ...(ids && { id: { in: ids } }),
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

  private async fetchSports(res: Row[], st: IdList, coachMembershipId: string, ids?: string[]) {
    const data = await this.prisma.sport.findMany({
      where: {
        ...coachOrGlobal(coachMembershipId),
        ...(ids && { id: { in: ids } }),
        ...(st && { sportTypeId: { in: st } }),
      },
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
    const methodTypeId = dto.cardioTypeId ?? (await this.resolveDefaultCardioMethodTypeId());
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
        const methodTypeId = dto.cardioTypeId ?? (await this.resolveDefaultCardioMethodTypeId());
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

  private updateStrength(id: string, base: Row, dto: UnifiedExerciseDto) {
    return updateStrengthExercise(this.prisma, id, base, dto);
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
