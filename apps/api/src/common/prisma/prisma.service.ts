import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  async onModuleDestroy(): Promise<void> {
    if (!hasDatabaseUrl()) {
      return;
    }
    await this.$disconnect();
  }

  async onModuleInit(): Promise<void> {
    if (!hasDatabaseUrl()) {
      return;
    }
    await this.$connect();
  }
}

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
