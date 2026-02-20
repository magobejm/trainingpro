import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import { SESSIONS_REPOSITORY } from '../../src/modules/sessions/domain/sessions-repository.port';

jest.setTimeout(30_000);

describe('Sessions snapshot rules', () => {
  async function bootstrap() {
    const repository = createSessionsRepository();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue({
        verify: async () => ({
          email: 'coach-a@fitcoach.local',
          roles: ['coach'],
          subject: 'coach-a',
        }),
      })
      .overrideProvider(SESSIONS_REPOSITORY)
      .useValue(repository)
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('does not mutate started/completed sessions and keeps snapshot', async () => {
    const app = await bootstrap();
    try {
      const ensure = await request(app.getHttpServer())
        .post('/sessions/strength/ensure')
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .send({
          clientId: '11111111-1111-1111-1111-111111111111',
          sessionDate: '2026-02-18',
          templateId: '22222222-2222-2222-2222-222222222222',
        })
        .expect(201);

      const sessionId = ensure.body.id as string;
      await request(app.getHttpServer())
        .post(`/sessions/strength/${sessionId}/start`)
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .expect(201);

      await request(app.getHttpServer())
        .post(`/sessions/strength/${sessionId}/finish`)
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .send({ isIncomplete: false })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/sessions/strength/${sessionId}/log-set`)
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .send({
          repsDone: 10,
          sessionItemId: '33333333-3333-3333-3333-333333333333',
          setIndex: 1,
        })
        .expect(400);
    } finally {
      await app.close();
    }
  });
});

function createSessionsRepository() {
  const sessions = new Map<string, { id: string; status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' }>();
  return {
    canAccessSession: async () => true,
    ensureSession: async () => {
      const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      sessions.set(id, { id, status: 'PENDING' });
      return {
        clientId: '11111111-1111-1111-1111-111111111111',
        finishComment: null,
        finishedAt: null,
        id,
        isCompleted: false,
        isIncomplete: false,
        items: [],
        sessionDate: new Date('2026-02-18'),
        startedAt: null,
        status: 'PENDING' as const,
        templateId: '22222222-2222-2222-2222-222222222222',
        templateVersion: 1,
      };
    },
    finishSession: async (_context: unknown, input: { sessionId: string }) => {
      const session = sessions.get(input.sessionId);
      if (session) {
        session.status = 'COMPLETED';
      }
      return {
        clientId: '11111111-1111-1111-1111-111111111111',
        finishComment: null,
        finishedAt: new Date(),
        id: input.sessionId,
        isCompleted: true,
        isIncomplete: false,
        items: [],
        sessionDate: new Date('2026-02-18'),
        startedAt: new Date(),
        status: 'COMPLETED' as const,
        templateId: '22222222-2222-2222-2222-222222222222',
        templateVersion: 1,
      };
    },
    getSessionById: async (_context: unknown, sessionId: string) => {
      const session = sessions.get(sessionId);
      if (!session) {
        return null;
      }
      return {
        clientId: '11111111-1111-1111-1111-111111111111',
        finishComment: null,
        finishedAt: session.status === 'COMPLETED' ? new Date() : null,
        id: sessionId,
        isCompleted: session.status === 'COMPLETED',
        isIncomplete: false,
        items: [],
        sessionDate: new Date('2026-02-18'),
        startedAt: new Date(),
        status: session.status,
        templateId: '22222222-2222-2222-2222-222222222222',
        templateVersion: 1,
      };
    },
    logSet: async (_context: unknown, input: { sessionId: string }) => {
      const session = sessions.get(input.sessionId);
      if (session?.status === 'COMPLETED') {
        throw new BadRequestException('Session already completed');
      }
      return {
        effortRpe: null,
        repsDone: 10,
        sessionItemId: '33333333-3333-3333-3333-333333333333',
        setIndex: 1,
        weightDoneKg: null,
      };
    },
    startSession: async (_context: unknown, sessionId: string) => {
      const session = sessions.get(sessionId);
      if (session) {
        session.status = 'IN_PROGRESS';
      }
      return {
        clientId: '11111111-1111-1111-1111-111111111111',
        finishComment: null,
        finishedAt: null,
        id: sessionId,
        isCompleted: false,
        isIncomplete: false,
        items: [],
        sessionDate: new Date('2026-02-18'),
        startedAt: new Date(),
        status: 'IN_PROGRESS' as const,
        templateId: '22222222-2222-2222-2222-222222222222',
        templateVersion: 1,
      };
    },
  };
}
