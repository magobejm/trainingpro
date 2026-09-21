import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PHYSICAL_TEST_CATALOG } from '../domain/physical-test-catalog';

@Injectable()
export class PhysicalTestsSeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedCatalog();
  }

  async seedCatalog(): Promise<void> {
    for (const [index, test] of PHYSICAL_TEST_CATALOG.entries()) {
      await this.prisma.physicalTest.upsert({
        where: { code: test.code },
        update: {
          category: test.category,
          name: test.name,
          level: test.level,
          objective: test.objective,
          whatToDo: test.whatToDo,
          whatToMeasure: test.whatToMeasure,
          options: test.options,
          normTables: test.normTables ?? Prisma.JsonNull,
          sortOrder: index,
        },
        create: {
          code: test.code,
          category: test.category,
          name: test.name,
          level: test.level,
          objective: test.objective,
          whatToDo: test.whatToDo,
          whatToMeasure: test.whatToMeasure,
          options: test.options,
          normTables: test.normTables ?? Prisma.JsonNull,
          sortOrder: index,
        },
      });
    }
  }
}
