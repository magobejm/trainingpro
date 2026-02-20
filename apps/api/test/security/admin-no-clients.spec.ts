import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import type { TokenVerifierPort } from '../../src/modules/auth/domain/token-verifier.port';
import { CLIENTS_REPOSITORY } from '../../src/modules/clients/domain/clients-repository.port';

describe('Admin cannot access client endpoints', () => {
  async function bootstrap(verifier: TokenVerifierPort) {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(verifier)
      .overrideProvider(CLIENTS_REPOSITORY)
      .useValue(createClientsRepositoryMock())
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('returns 403 when admin role accesses /clients', async () => {
    const app = await bootstrap({
      verify: async () => ({ email: 'admin@fitcoach.dev', roles: ['admin'], subject: 'admin-1' }),
    });

    await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', 'Bearer valid-token')
      .set('x-active-role', 'admin')
      .expect(403);

    await app.close();
  });

  it('allows coach role on /clients', async () => {
    const app = await bootstrap({
      verify: async () => ({ email: 'coach@fitcoach.dev', roles: ['coach'], subject: 'coach-1' }),
    });

    await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', 'Bearer valid-token')
      .set('x-active-role', 'coach')
      .expect(200);

    await app.close();
  });
});

function createClientsRepositoryMock() {
  return {
    archiveClient: async () => {},
    canCoachAccessClient: async () => true,
    createClient: async () => {
      throw new Error('not used');
    },
    getClientById: async () => null,
    listClientsByCoach: async () => [],
  };
}
