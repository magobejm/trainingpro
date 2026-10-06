import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import { SESSIONS_REPOSITORY } from '../../src/modules/sessions/domain/sessions-repository.port';

jest.setTimeout(30_000);

const SESSION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';

describe('Session access', () => {
  it('rejects log-set and finish when the caller cannot access the session', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(createVerifier())
      .overrideProvider(SESSIONS_REPOSITORY)
      .useValue({ canAccessSession: async () => false })
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    try {
      const http = request(app.getHttpServer());
      await http
        .post(`/sessions/${SESSION_ID}/log-set`)
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .send({ repsDone: 8, sessionItemId: ITEM_ID, setIndex: 1 })
        .expect(403);
      await http
        .post(`/sessions/${SESSION_ID}/finish`)
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .send({ isIncomplete: false })
        .expect(403);
    } finally {
      await app.close();
    }
  });
});

function createVerifier() {
  return {
    verify: async () => ({
      email: 'coach-a@fitcoach.local',
      roles: ['coach'],
      subject: 'coach-a',
    }),
  };
}
