import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import { CLIENTS_REPOSITORY } from '../../src/modules/clients/domain/clients-repository.port';
import { mapClientFromSeed } from './helpers/client-fixtures';

type MemoryClient = {
  archived: boolean;
  coach: string;
  id: string;
};

async function bootstrap() {
  const repository = createSoftDeleteRepository();
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
    .overrideProvider(CLIENTS_REPOSITORY)
    .useValue(repository)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Clients soft delete', () => {
  it('hides archived client from list and get', async () => {
    const app = await bootstrap();
    await request(app.getHttpServer())
      .delete('/clients/client-a')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .expect(200);

    await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(0);
      });

    await request(app.getHttpServer())
      .get('/clients/client-a')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .expect(404);
    await app.close();
  });
});

function createSoftDeleteRepository() {
  const clients: MemoryClient[] = [{ archived: false, coach: 'coach-a', id: 'client-a' }];
  return {
    archiveClient: async (_context: { subject: string }, clientId: string) => {
      const client = clients.find((item) => item.id === clientId && !item.archived);
      if (client) {
        client.archived = true;
      }
    },
    canCoachAccessClient: async (coachSubject: string, clientId: string) =>
      clients.some((item) => item.id === clientId && item.coach === coachSubject),
    createClient: async () => {
      throw new Error('not used');
    },
    getClientById: async (_context: { subject: string }, clientId: string) => {
      const client = clients.find((item) => item.id === clientId && !item.archived);
      return mapClientFromSeed(client ?? null);
    },
    listClientsByCoach: async (context: { subject: string }) => {
      const visible = clients.filter((item) => item.coach === context.subject && !item.archived);
      return visible.map((item) => mapClientFromSeed(item)).filter(Boolean);
    },
  };
}
