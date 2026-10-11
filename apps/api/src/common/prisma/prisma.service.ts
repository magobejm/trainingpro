import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@prisma/client';

export type PerfQueryEvent = { durationMs: number; params: string; sql: string };

const perfQueries: PerfQueryEvent[] = [];

export function takePerfQueries(): PerfQueryEvent[] {
  return perfQueries.splice(0, perfQueries.length);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  constructor() {
    super(queryLogOptions());
    this.listenForPerfQueries();
  }

  private listenForPerfQueries(): void {
    if (process.env.PERF_QUERY_LOG !== '1') return;
    const client = this as PrismaClient<{ log: [{ emit: 'event'; level: 'query' }] }>;
    client.$on('query', (event) => {
      perfQueries.push({ durationMs: event.duration, params: event.params, sql: event.query });
    });
  }
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

function queryLogOptions(): Prisma.PrismaClientOptions | undefined {
  if (process.env.PERF_QUERY_LOG !== '1') return undefined;
  return { log: [{ emit: 'event', level: 'query' }] };
}
