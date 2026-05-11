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
    try {
      await this.$connect();
    } catch (err) {
      // Don't crash bootstrap — /health and other DB-less endpoints must
      // stay reachable (CI smoke test, transient DB outage at boot).
      // PrismaClient retries lazily on the first query.
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[PrismaService] eager $connect failed; will retry on first query: ${message}`);
    }
  }
}

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
