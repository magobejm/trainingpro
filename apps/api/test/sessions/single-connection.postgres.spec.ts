import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { ClearFutureWorkoutsUseCase } from '../../src/modules/calendar/application/use-cases/clear-future-workouts.usecase';
import { ClientRepositoryPrisma } from '../../src/modules/clients/infra/prisma/client.repository.prisma';
import { CoachBrandingService } from '../../src/modules/coaches/application/coach-branding.service';
import { ExportWeeklyPdfUseCase } from '../../src/modules/reports/application/use-cases/export-weekly-pdf.usecase';
import { buildSimplePdf } from '../../src/modules/reports/infra/pdf/simple-pdf.builder';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { sessionFixture } from './session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
const day = new Date('2026-10-16');
jest.setTimeout(45000);

type Result<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown };

// This suite uses one PrismaClient and one PostgreSQL connection for every concurrent request.
// eslint-disable-next-line max-lines-per-function
postgres('coach workflows with connection_limit=1', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  let planDayId: string;
  let nextRoutineId: string;
  const coach = () => ({ ...fixture.context, activeRole: 'coach' as const, roles: ['coach' as const] });
  const sessions = () =>
    new SessionsRepositoryPrisma(db as PrismaService, new SessionsCardioRepositoryPrisma(db as PrismaService));
  const clients = () => new ClientRepositoryPrisma(db as PrismaService);
  const exportPdf = () =>
    new ExportWeeklyPdfUseCase(
      db as PrismaService,
      { render: buildSimplePdf },
      new CoachBrandingService(db as PrismaService, {} as never, {} as never),
    );

  beforeAll(async () => {
    const local = new URL(url!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(local.hostname)) throw new Error('Requires a local test database');
    local.searchParams.set('connection_limit', '1');
    local.searchParams.set('pool_timeout', '10');
    db = new PrismaClient({ datasources: { db: { url: local.toString() } } });
    fixture = await sessionFixture(db);
    const planDay = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: 0,
        title: 'Single connection workout',
        exercises: { create: { displayName: 'Squat', setsPlanned: 1 } },
      },
    });
    planDayId = planDay.id;
    nextRoutineId = (
      await db.planTemplate.create({
        data: { name: 'TP-34 next', coachMembershipId: fixture.member.id, organizationId: fixture.org.id },
      })
    ).id;
  });

  beforeEach(async () => {
    await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
    await db.sessionInstance.deleteMany({ where: { clientId: fixture.client.id } });
    await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: fixture.template.id } });
  });

  afterAll(async () => {
    try {
      if (fixture) {
        await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
        await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: null } });
        await db.sessionInstance.deleteMany({ where: { clientId: fixture.client.id } });
        await db.client.update({ where: { id: fixture.client.id }, data: { activeRoutineAssignmentId: null } });
        await db.routineAssignment.deleteMany({ where: { clientId: fixture.client.id } });
        await db.routineRevision.deleteMany({ where: { templateId: nextRoutineId } });
        await db.planTemplate.delete({ where: { id: nextRoutineId } });
        await fixture.cleanup();
      }
    } finally {
      await db?.$disconnect();
    }
  });

  it('serializes simultaneous assignment, session creation, start, set logging and PDF export', async () => {
    const event = await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: day,
        planDayId,
        type: 'workout',
        title: 'Single connection workout',
      },
    });
    const ensure = () =>
      sessions().ensureSession(coach(), {
        clientId: fixture.client.id,
        templateId: fixture.template.id,
        planDayId,
        sessionDate: day,
      });
    const created = await Promise.all([timed('ensure-1', ensure), timed('ensure-2', ensure)]);
    expect(created[0]!.id).toBe(created[1]!.id);
    expect(await db.sessionInstance.count({ where: { clientId: fixture.client.id, planDayId } })).toBe(1);
    const backends = await Promise.all([
      db.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`,
      db.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`,
    ]);
    expect(backends[0]![0]!.pid).toBe(backends[1]![0]!.pid);
    const preview = await new ClearFutureWorkoutsUseCase(db as PrismaService).execute(coach(), {
      clientId: fixture.client.id,
      from: '2026-10-16',
      dryRun: true,
    });
    if (!('signature' in preview)) throw new Error('Expected a dry-run preview');
    const session = created[0]!;
    const setInput = { sessionId: session.id, sessionItemId: session.items[0]!.id, setIndex: 0, repsDone: 8 };
    const results = await Promise.allSettled([
      timed('assignment', () =>
        clients().updateClient(coach(), fixture.client.id, {
          trainingPlanId: nextRoutineId,
          routineHandoff: { mode: 'replace', from: '2026-10-16', expectedSignature: preview.signature },
        }),
      ),
      timed('start-1', () => sessions().startSession(fixture.context, { sessionId: session.id })),
      timed('start-2', () => sessions().startSession(fixture.context, { sessionId: session.id })),
      timed('log-1', () => sessions().logSet(fixture.context, setInput)),
      timed('log-2', () => sessions().logSet(fixture.context, setInput)),
      timed('export', () => exportPdf().execute(coach(), { clientId: fixture.client.id, from: day, to: day })),
    ]);
    const [assignment, startOne, startTwo, logOne, logTwo, pdf] = results as [
      Result<unknown>,
      Result<unknown>,
      Result<unknown>,
      Result<unknown>,
      Result<unknown>,
      Result<{ data: Buffer }>,
    ];
    for (const outcome of [startOne, startTwo, logOne, logTwo, pdf]) expect(outcome.status).toBe('fulfilled');
    if (pdf.status === 'fulfilled') expect(pdf.value.data.subarray(0, 4).toString()).toBe('%PDF');
    if (assignment.status === 'rejected') expect(conflictCode(assignment.reason)).toBe('ROUTINE_HANDOFF_CHANGED');
    const current = await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } });
    const calendar = await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } });
    expect(current.trainingPlanId).toBe(assignment.status === 'fulfilled' ? nextRoutineId : fixture.template.id);
    expect(Boolean(calendar.archivedAt)).toBe(assignment.status === 'fulfilled');
    expect(
      await db.setLog.count({ where: { sessionId: session.id, sessionItemId: setInput.sessionItemId, setIndex: 0 } }),
    ).toBe(1);
    expect((await db.sessionInstance.findUniqueOrThrow({ where: { id: session.id } })).status).toBe('IN_PROGRESS');
  });

  it('rejects a stale assignment with no partial writes while export runs', async () => {
    const event = await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: day,
        planDayId,
        type: 'workout',
        title: 'Single connection workout',
      },
    });
    const session = await sessions().ensureSession(coach(), {
      clientId: fixture.client.id,
      templateId: fixture.template.id,
      planDayId,
      sessionDate: day,
    });
    const preview = await new ClearFutureWorkoutsUseCase(db as PrismaService).execute(coach(), {
      clientId: fixture.client.id,
      from: '2026-10-16',
      dryRun: true,
    });
    if (!('signature' in preview)) throw new Error('Expected a dry-run preview');
    await timed('start-before-confirmation', () => sessions().startSession(fixture.context, { sessionId: session.id }));
    const [assignment, pdf] = await Promise.allSettled([
      timed('stale-assignment', () =>
        clients().updateClient(coach(), fixture.client.id, {
          trainingPlanId: nextRoutineId,
          routineHandoff: { mode: 'replace', from: '2026-10-16', expectedSignature: preview.signature },
        }),
      ),
      timed('export-with-conflict', () => exportPdf().execute(coach(), { clientId: fixture.client.id, from: day, to: day })),
    ]);
    expect(assignment.status).toBe('rejected');
    if (assignment.status === 'rejected') expect(conflictCode(assignment.reason)).toBe('ROUTINE_HANDOFF_CHANGED');
    expect(pdf.status).toBe('fulfilled');
    expect((await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } })).trainingPlanId).toBe(
      fixture.template.id,
    );
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } })).archivedAt).toBeNull();
    expect(await db.sessionInstance.count({ where: { clientId: fixture.client.id, planDayId } })).toBe(1);
  });

  it('commits an uncontested assignment while two exports share the connection', async () => {
    const event = await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: day,
        planDayId,
        type: 'workout',
        title: 'Single connection workout',
      },
    });
    const preview = await new ClearFutureWorkoutsUseCase(db as PrismaService).execute(coach(), {
      clientId: fixture.client.id,
      from: '2026-10-16',
      dryRun: true,
    });
    if (!('signature' in preview)) throw new Error('Expected a dry-run preview');
    const [updated, firstPdf, secondPdf] = await Promise.all([
      timed('assignment-with-exports', () =>
        clients().updateClient(coach(), fixture.client.id, {
          trainingPlanId: nextRoutineId,
          routineHandoff: { mode: 'replace', from: '2026-10-16', expectedSignature: preview.signature },
        }),
      ),
      timed('export-1', () => exportPdf().execute(coach(), { clientId: fixture.client.id, from: day, to: day })),
      timed('export-2', () => exportPdf().execute(coach(), { clientId: fixture.client.id, from: day, to: day })),
    ]);
    expect(updated.trainingPlanId).toBe(nextRoutineId);
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } })).archivedAt).not.toBeNull();
    expect(firstPdf.data.subarray(0, 4).toString()).toBe('%PDF');
    expect(secondPdf.data.subarray(0, 4).toString()).toBe('%PDF');
  });
});

async function timed<T>(name: string, run: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    const value = await run();
    console.info(
      `[TP-34] ${JSON.stringify({ operation: name, durationMs: Math.round(performance.now() - started), outcome: 'ok' })}`,
    );
    return value;
  } catch (error) {
    console.info(
      `[TP-34] ${JSON.stringify({ operation: name, durationMs: Math.round(performance.now() - started), outcome: 'error', cause: errorCause(error) })}`,
    );
    throw error;
  }
}

function conflictCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('getResponse' in error)) return undefined;
  const response = (error as { getResponse(): unknown }).getResponse();
  return response && typeof response === 'object' && 'code' in response ? String(response.code) : undefined;
}

function errorCause(error: unknown): string {
  const code = conflictCode(error);
  if (code) return code;
  if (error && typeof error === 'object' && 'code' in error) return String(error.code);
  return error instanceof Error ? error.message : String(error);
}
