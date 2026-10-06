import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';

jest.setTimeout(30_000);

describe('Admin cannot access client data', () => {
  it('returns 403 for progress, incidents and session ensure', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue({
        verify: async () => ({
          email: 'admin@fitcoach.dev',
          roles: ['admin'],
          subject: 'admin-1',
        }),
      })
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    try {
      const http = request(app.getHttpServer());
      const headers = { Authorization: 'Bearer valid-token', 'x-active-role': 'admin' };
      await http.get('/progress/overview').set(headers).expect(403);
      await http.get('/incidents').set(headers).expect(403);
      await http.post('/sessions/ensure').set(headers).send({}).expect(403);
    } finally {
      await app.close();
    }
  });
});
