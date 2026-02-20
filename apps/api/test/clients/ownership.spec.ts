import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import type { TokenVerifierPort } from '../../src/modules/auth/domain/token-verifier.port';
import { CLIENTS_REPOSITORY } from '../../src/modules/clients/domain/clients-repository.port';

type FakeClient = {
  coach: string;
  id: string;
};

describe('Clients ownership', () => {
  async function bootstrap() {
    const repository = createOwnershipRepository();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(createVerifier())
      .overrideProvider(CLIENTS_REPOSITORY)
      .useValue(repository)
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('blocks coach A from reading coach B client', async () => {
    const app = await bootstrap();
    await request(app.getHttpServer())
      .get('/clients/client-b')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .expect(403);
    await app.close();
  });

  it('allows coach B to read own client', async () => {
    const app = await bootstrap();
    await request(app.getHttpServer())
      .get('/clients/client-b')
      .set('Authorization', 'Bearer coach-b')
      .set('x-active-role', 'coach')
      .expect(200);
    await app.close();
  });
});

function createOwnershipRepository() {
  const clients: FakeClient[] = [{ coach: 'coach-b', id: 'client-b' }];
  return {
    archiveClient: async () => {},
    canCoachAccessClient: async (coachSubject: string, clientId: string) =>
      clients.some((client) => client.id === clientId && client.coach === coachSubject),
    createClient: async () => {
      throw new Error('not used');
    },
    getClientById: async (_context: { subject: string }, clientId: string) =>
      mapClient(clients.find((client) => client.id === clientId) ?? null),
    listClientsByCoach: async () => [],
  };
}

function createVerifier(): TokenVerifierPort {
  return {
    verify: async (token: string) => ({
      email: `${token}@fitcoach.local`,
      roles: ['coach'],
      subject: token,
    }),
  };
}

function mapClient(row: FakeClient | null) {
  if (!row) {
    return null;
  }
  return {
    birthDate: null,
    coachMembershipId: `membership-${row.coach}`,
    createdAt: new Date(),
    email: `${row.id}@fitcoach.local`,
    firstName: 'Fake',
    heightCm: null,
    id: row.id,
    lastName: 'Client',
    notes: null,
    objective: null,
    organizationId: 'org-1',
    phone: null,
    sex: null,
    updatedAt: new Date(),
  };
}
