import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { ZodValidationPipe } from '../../src/common/zod-validation.pipe';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuthGuard } from '../../src/modules/auth/presentation/guards/auth.guard';
import { ClientRoutineColorsController } from '../../src/modules/clients/presentation/controllers/client-routine-colors.controller';
import { ClientRoutineColorsService } from '../../src/modules/clients/application/services/client-routine-colors.service';
import { ClientAccessPolicy } from '../../src/modules/clients/domain/policies/client-access.policy';
import { ClientRepositoryPrisma } from '../../src/modules/clients/infra/prisma/client.repository.prisma';
import { sessionFixture } from '../sessions/session-transitions.fixture';

const url = process.env.TEST_ROUTINE_COLORS_DATABASE_URL;
const postgres = url ? describe : describe.skip;
// eslint-disable-next-line max-lines-per-function
postgres('routine day color HTTP persistence (isolated PostgreSQL)', () => {
  let db: PrismaClient;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  let other: Awaited<ReturnType<typeof sessionFixture>>;
  let dayId: string;
  let secondDay: string;
  let siblingId: string;
  let role = 'coach';
  const path = (id = fixture.client.id) => `/clients/${id}/routine-day-colors`;
  const patch = (client = fixture.client.id, day = dayId, color = '#e2e8f0') =>
    request(app.getHttpServer())
      .patch(`${path(client)}/${day}`)
      .set('X-Active-Role', role)
      .send({ color });
  beforeAll(async () => {
    const target = new URL(url!);
    if (!['localhost', '127.0.0.1'].includes(target.hostname) || !target.pathname.startsWith('/routine_colors_test_')) {
      throw new Error('Requires a dedicated local routine_colors_test_ database');
    }
    target.searchParams.set('connection_limit', '1');
    db = new PrismaClient({ datasources: { db: { url: target.toString() } } });
    fixture = await sessionFixture(db);
    other = await sessionFixture(db);
    dayId = (await db.planDay.create({ data: { templateId: fixture.template.id, dayIndex: 1, title: 'Pull' } })).id;
    secondDay = (await db.planDay.create({ data: { templateId: fixture.template.id, dayIndex: 2, title: 'Push' } })).id;
    await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: fixture.template.id } });
    siblingId = (
      await db.client.create({
        data: { ...fixture.client, id: undefined, trainingPlanId: fixture.template.id, email: 'sibling@example.test' },
      })
    ).id;
    const prisma = db as PrismaService;
    const module = await Test.createTestingModule({
      controllers: [ClientRoutineColorsController],
      providers: [
        ClientRoutineColorsService,
        { provide: PrismaService, useValue: db },
        {
          provide: ClientAccessPolicy,
          useValue: new ClientAccessPolicy(new ClientRepositoryPrisma(prisma)),
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.use((req: object, _res: object, next: () => void) => {
      Object.assign(req, { user: { subject: fixture.context.subject, roles: [role] }, activeRole: role });
      next();
    });
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    if (fixture) {
      await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
      if (siblingId) await db.client.delete({ where: { id: siblingId } });
      await fixture.cleanup();
    }
    if (other) await other.cleanup();
    await db?.$disconnect();
  });
  it('persists selections, upserts without duplicates and keeps each client independent', async () => {
    await request(app.getHttpServer()).get(path()).set('X-Active-Role', 'coach').expect(200, { colors: [] });
    await patch().expect(200, { planDayId: dayId, color: '#e2e8f0' });
    await patch(fixture.client.id, dayId, '#dbeafe').expect(200);
    await patch(siblingId, dayId, '#fef3c7').expect(200);
    expect((await request(app.getHttpServer()).get(path()).set('X-Active-Role', 'coach').expect(200)).body).toEqual({
      colors: [{ planDayId: dayId, color: '#dbeafe' }],
    });
    expect(await db.clientRoutineDayColor.count()).toBe(2);
  });
  it('serializes concurrent changes with one connection without losing another day or changing existing events', async () => {
    const event = await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date(),
        type: 'workout',
        planDayId: dayId,
        color: '#dbeafe',
      },
    });
    await Promise.all([
      patch(fixture.client.id, dayId, '#fef3c7').expect(200),
      patch(fixture.client.id, secondDay, '#e2e8f0').expect(200),
    ]);
    expect(await db.clientRoutineDayColor.count({ where: { clientId: fixture.client.id } })).toBe(2);
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } })).color).toBe('#dbeafe');
  });
  it('rejects other coaches clients, unassigned days, invalid colors and client roles without writing', async () => {
    const count = await db.clientRoutineDayColor.count();
    await patch(other.client.id).expect(403);
    await request(app.getHttpServer()).get(path(other.client.id)).set('X-Active-Role', 'coach').expect(403);
    const foreignDay = await db.planDay.create({ data: { templateId: other.template.id, dayIndex: 1, title: 'Other' } });
    await patch(fixture.client.id, foreignDay.id).expect(400);
    await patch(fixture.client.id, dayId, 'var(--color)').expect(400);
    role = 'client';
    try {
      await patch().expect(403);
    } finally {
      role = 'coach';
    }
    expect(await db.clientRoutineDayColor.count()).toBe(count);
  });
});
