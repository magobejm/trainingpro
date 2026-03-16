import { Injectable } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  MOVEMENT_PATTERNS,
  MOBILITY_EXTRA_PATTERNS,
  ANATOMICAL_PLANES,
  MOBILITY_TYPES,
  SPORT_TYPES,
  NEW_EQUIPMENT,
  MOBILITY_PATTERN_MAP,
  MOBILITY_PLANE_MAP,
  MOBILITY_BODY_PART_MAP,
  MOBILITY_EQUIPMENT_MAP,
  SPORT_PATTERN_MAP,
  SPORT_PLANE_MAP,
  SPORT_TYPE_MAP,
  SPORT_EQUIPMENT_MAP,
  type CatalogEntry,
} from './library-seed.data';
import { MOBILITY_EXERCISES } from './library-seed-mobility.data';
import { SPORT_EXERCISES } from './library-seed-sport.data';

type CodeMap = Record<string, string>;

type LookupMaps = {
  patternById: CodeMap;
  planeById: CodeMap;
  mTypeById: CodeMap;
  sTypeById: CodeMap;
  equipById: CodeMap;
};

@Injectable()
export class LibrarySeedService {
  constructor(private readonly prisma: PrismaService) {}

  async seedBiomechanics() {
    for (const p of MOVEMENT_PATTERNS) {
      await this.prisma.movementPattern.upsert({
        where: { code: p.code },
        update: { label: p.label, sortOrder: p.sortOrder },
        create: { ...p, isDefault: p.isDefault ?? false },
      });
    }
    for (const p of ANATOMICAL_PLANES) {
      await this.prisma.anatomicalPlane.upsert({
        where: { code: p.code },
        update: { label: p.label, sortOrder: p.sortOrder },
        create: { ...p, isDefault: p.isDefault ?? false },
      });
    }
    return { success: true };
  }

  async seedMobilityLibrary() {
    await this.upsertCatalog(MOBILITY_EXTRA_PATTERNS, (p) =>
      this.prisma.movementPattern.upsert({
        where: { code: p.code }, update: {}, create: { ...p, isDefault: false },
      }),
    );
    await this.upsertCatalog(MOBILITY_TYPES, (mt) =>
      this.prisma.mobilityTypeRef.upsert({
        where: { code: mt.code }, update: {}, create: { ...mt, isDefault: mt.isDefault ?? false },
      }),
    );
    await this.upsertCatalog(NEW_EQUIPMENT, (eq) =>
      this.prisma.exerciseEquipment.upsert({
        where: { code: eq.code }, update: {}, create: { ...eq, isDefault: false },
      }),
    );
    const maps = await this.buildLookupMaps();
    return this.seedMobilityExercises(maps);
  }

  async seedSportsLibrary() {
    await this.upsertCatalog(SPORT_TYPES, (st) =>
      this.prisma.sportTypeRef.upsert({
        where: { code: st.code }, update: {}, create: { ...st, isDefault: st.isDefault ?? false },
      }),
    );
    const maps = await this.buildLookupMaps();
    return this.seedSportExercises(maps);
  }

  private async upsertCatalog(entries: CatalogEntry[], fn: (e: CatalogEntry) => Promise<unknown>) {
    for (const e of entries) await fn(e);
  }

  private async buildLookupMaps(): Promise<LookupMaps> {
    const [patterns, planes, mTypeRefs, sTypeRefs, allEquipment] = await Promise.all([
      this.prisma.movementPattern.findMany(),
      this.prisma.anatomicalPlane.findMany(),
      this.prisma.mobilityTypeRef.findMany(),
      this.prisma.sportTypeRef.findMany(),
      this.prisma.exerciseEquipment.findMany(),
    ]);
    const toMap = (rows: { code: string; id: string }[]): CodeMap =>
      Object.fromEntries(rows.map((r) => [r.code, r.id]));
    return {
      patternById: toMap(patterns),
      planeById: toMap(planes),
      mTypeById: toMap(mTypeRefs),
      sTypeById: toMap(sTypeRefs),
      equipById: toMap(allEquipment),
    };
  }

  private async seedMobilityExercises(maps: LookupMaps): Promise<{ success: boolean; seeded: number }> {
    let seeded = 0;
    for (const ex of MOBILITY_EXERCISES) {
      const existing = await this.prisma.mobilityExercise.findFirst({
        where: { name: ex.name, scope: LibraryItemScope.GLOBAL },
      });
      if (existing) continue;
      const patternCode = MOBILITY_PATTERN_MAP[ex.movementPattern];
      const planeCode = MOBILITY_PLANE_MAP[ex.anatomicalPlane];
      const mTypeCode = MOBILITY_BODY_PART_MAP[ex.bodyPart];
      const eqCode = MOBILITY_EQUIPMENT_MAP[ex.name] ?? 'undefined';
      await this.prisma.mobilityExercise.create({
        data: {
          scope: LibraryItemScope.GLOBAL,
          name: ex.name,
          description: ex.description,
          coachInstructions: ex.instructions,
          movementPatternId: patternCode ? (maps.patternById[patternCode] ?? null) : null,
          anatomicalPlaneId: planeCode ? (maps.planeById[planeCode] ?? null) : null,
          mobilityTypeId: mTypeCode ? (maps.mTypeById[mTypeCode] ?? null) : null,
          equipmentId: maps.equipById[eqCode] ?? null,
        },
      });
      seeded++;
    }
    return { success: true, seeded };
  }

  private async seedSportExercises(maps: LookupMaps): Promise<{ success: boolean; seeded: number }> {
    let seeded = 0;
    for (const ex of SPORT_EXERCISES) {
      const existing = await this.prisma.sport.findFirst({
        where: { name: ex.name, scope: LibraryItemScope.GLOBAL },
      });
      if (existing) continue;
      const patternCode = SPORT_PATTERN_MAP[ex.movementPattern];
      const planeCode = SPORT_PLANE_MAP[ex.anatomicalPlane];
      const sTypeCode = SPORT_TYPE_MAP[ex.sportType];
      const eqCode = SPORT_EQUIPMENT_MAP[ex.name] ?? 'undefined';
      await this.prisma.sport.create({
        data: {
          scope: LibraryItemScope.GLOBAL,
          name: ex.name,
          description: ex.description,
          coachInstructions: ex.instructions,
          icon: 'Activity',
          movementPatternId: patternCode ? (maps.patternById[patternCode] ?? null) : null,
          anatomicalPlaneId: planeCode ? (maps.planeById[planeCode] ?? null) : null,
          sportTypeId: sTypeCode ? (maps.sTypeById[sTypeCode] ?? null) : null,
          equipmentId: maps.equipById[eqCode] ?? null,
        },
      });
      seeded++;
    }
    return { success: true, seeded };
  }
}
