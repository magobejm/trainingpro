import request from 'supertest';
import { ROLES_METADATA_KEY } from '../../src/modules/auth/presentation/decorators/roles.decorator';
import { ChatController } from '../../src/modules/chat/presentation/controllers/chat.controller';
import { ClientsController } from '../../src/modules/clients/presentation/controllers/clients.controller';
import { PlansController } from '../../src/modules/plans/presentation/controllers/plans.controller';
import { SessionsController } from '../../src/modules/sessions/presentation/controllers/sessions.controller';
import {
  chatMessagesExample,
  clientListExample,
  SESSION_ID,
  sessionExample,
  strengthPlanListExample,
  THREAD_ID,
} from '../../contracts/examples';
import { createChatApp, createClientsApp, createPlansApp, createSessionApp } from './http-apps';

describe('contract routes', () => {
  beforeAll(() => {
    process.env.PUBLIC_ASSET_BASE_URL = 'http://localhost:8080';
  });

  it('returns the client list for a coach', async () => {
    expect(Reflect.getMetadata(ROLES_METADATA_KEY, ClientsController)).toEqual(['coach']);
    const app = await createClientsApp();
    const response = await request(app.getHttpServer()).get('/clients').expect(200);
    expect(response.body).toEqual(clientListExample);
    await app.close();
  });

  it('returns strength templates for a coach', async () => {
    expect(Reflect.getMetadata(ROLES_METADATA_KEY, PlansController)).toEqual(['coach']);
    const app = await createPlansApp();
    const response = await request(app.getHttpServer()).get('/plans/templates/strength').expect(200);
    expect(response.body).toEqual(strengthPlanListExample);
    await app.close();
  });

  it('returns a session for a coach', async () => {
    expect(Reflect.getMetadata(ROLES_METADATA_KEY, SessionsController)).toEqual(['coach', 'client']);
    const app = await createSessionApp();
    const response = await request(app.getHttpServer()).get(`/sessions/${SESSION_ID}`).expect(200);
    expect(response.body).toEqual(sessionExample);
    await app.close();
  });

  it('returns chat messages for a coach', async () => {
    expect(Reflect.getMetadata(ROLES_METADATA_KEY, ChatController)).toEqual(['coach', 'client']);
    const app = await createChatApp();
    const response = await request(app.getHttpServer()).get('/chat/messages').query({ threadId: THREAD_ID }).expect(200);
    expect(response.body).toEqual(chatMessagesExample);
    await app.close();
  });
});
