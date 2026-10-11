/* eslint-disable no-console */
import './perf-query-flag';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import { PrismaService, takePerfQueries, type PerfQueryEvent } from '../../src/common/prisma/prisma.service';
import { PERF_COACH_EMAIL, PERF_COACH_UID } from './perf-config';
import { ALLOWED_BODY_DIFFS, diffBodies, stable } from './perf-compare';
import { buildProbes, isoDaysAgo, type PerfManifest, type Probe } from './perf-probes';
import { bindParams, summarize, type EndpointReport, type Sample } from './perf-stats';

const CLIENT_EMAIL = 'perf-client-1@perf.local';
const OUT_DIR = join(__dirname, '../../../../.run/perf');

export async function runMeasurement(): Promise<void> {
  const compare = process.argv.includes('--compare') || process.env.PERF_COMPARE === '1';
  const label = compare ? 'after' : 'before';
  const manifest = JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf8')) as PerfManifest;
  const iterations = readIterations();
  const app = await bootstrap();
  const prisma = app.get(PrismaService);
  const probes = buildProbes(manifest, isoDaysAgo(84), isoDaysAgo(0), isoDaysAgo(41));
  const reports: Record<string, EndpointReport> = {};
  const bodies: Record<string, unknown> = {};
  try {
    for (const probe of probes) {
      const result = await measureProbe(app, prisma, probe, iterations);
      reports[probe.name] = result.report;
      bodies[probe.name] = result.body;
      const report = result.report;
      const summary = `status=${report.status} median=${report.medianMs}ms`;
      console.log(`${probe.name} ${summary} queries=${report.queries} bytes=${report.bytes}`);
    }
  } finally {
    await app.close();
  }
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${label}.json`), JSON.stringify(reports, null, 2));
  writeFileSync(join(OUT_DIR, `${label}-bodies.json`), JSON.stringify(bodies));
  if (compare) assertEquivalent(bodies);
  console.log(`Medición ${label} guardada.`);
}

async function measureProbe(
  app: INestApplication,
  prisma: PrismaService,
  probe: Probe,
  iterations: number,
): Promise<{ body: unknown; report: EndpointReport }> {
  const samples: Sample[] = [];
  let body: unknown = null;
  let slowest: PerfQueryEvent | undefined;
  let error: string | undefined;
  for (let index = 0; index < iterations; index += 1) {
    takePerfQueries();
    const started = performance.now();
    const response = await request(app.getHttpServer())
      .get(probe.path)
      .query(probe.query ?? {})
      .set(headers(probe.role));
    const queries = takePerfQueries();
    samples.push({
      bytes: Buffer.byteLength(JSON.stringify(response.body ?? null)),
      ms: Math.round(performance.now() - started),
      queries: queries.length,
      status: response.status,
    });
    if (response.status >= 400) error = JSON.stringify(response.body).slice(0, 240);
    else body = stable(response.body);
    const candidate = slowestSelect(queries);
    if (candidate && (!slowest || candidate.durationMs > slowest.durationMs)) slowest = candidate;
  }
  return { body, report: { ...summarize(samples), error, explain: await explainSlowest(prisma, slowest) } };
}

function slowestSelect(queries: PerfQueryEvent[]): PerfQueryEvent | undefined {
  return queries
    .filter((query) => /^\s*select/i.test(query.sql))
    .sort((left, right) => right.durationMs - left.durationMs)[0];
}

async function explainSlowest(prisma: PrismaService, query: PerfQueryEvent | undefined): Promise<string | undefined> {
  if (!query) return undefined;
  try {
    const sql = `EXPLAIN (ANALYZE, BUFFERS) ${bindParams(query.sql, query.params)}`;
    const rows = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(sql);
    return rows.map((row) => row['QUERY PLAN']).join('\n');
  } catch (error) {
    return error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]') : 'explain failed';
  }
}

function headers(role: 'client' | 'coach'): Record<string, string> {
  if (role === 'client') {
    return { Authorization: 'Bearer perf-client', 'x-active-role': 'client' };
  }
  return { Authorization: 'Bearer perf-coach', 'x-active-role': 'coach' };
}

async function bootstrap(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(TOKEN_VERIFIER)
    .useValue({
      verify: async (token: string) =>
        token === 'perf-client'
          ? { email: CLIENT_EMAIL, roles: ['client'], subject: 'c14c14c1-0000-4000-8000-0000000000c2' }
          : { email: PERF_COACH_EMAIL, roles: ['coach'], subject: PERF_COACH_UID },
    })
    .compile();
  const app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });
  await app.init();
  return app;
}

function assertEquivalent(after: Record<string, unknown>): void {
  const before = JSON.parse(readFileSync(join(OUT_DIR, 'before-bodies.json'), 'utf8')) as Record<string, unknown>;
  const failures: string[] = [];
  for (const name of Object.keys(after)) {
    if (ALLOWED_BODY_DIFFS[name]) continue;
    const changes = diffBodies(before[name], after[name]);
    if (changes.length > 0) failures.push(`${name}: ${changes.join('; ')}`);
  }
  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }
}

function readIterations(): number {
  const value = Number(process.env.PERF_ITERATIONS ?? 20);
  if (!Number.isInteger(value) || value < 1 || value > 50) throw new Error('PERF_ITERATIONS must be 1..50');
  return value;
}

if (process.env.PERF_MEASURE_DIRECT === '1') {
  runMeasurement().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'perf-measure failed';
    console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]'));
    process.exitCode = 1;
  });
}
