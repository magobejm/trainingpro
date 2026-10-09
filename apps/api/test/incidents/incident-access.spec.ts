import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import type { IncidentView } from '../../src/modules/incidents/domain/incident.entity';
import type { CreateIncidentInput } from '../../src/modules/incidents/domain/incident.input';
import { INCIDENTS_REPOSITORY } from '../../src/modules/incidents/domain/incidents.repository.port';

jest.setTimeout(30_000);

const INCIDENT_ID = '44444444-4444-4444-8444-444444444444';
const OWNER = 'coach-1';

describe('Incident access', () => {
  it('lets the client create and their coach respond, and blocks another coach and admin', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(createVerifier())
      .overrideProvider(INCIDENTS_REPOSITORY)
      .useValue(createIncidentRepository())
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    try {
      const http = request(app.getHttpServer());
      const created = await http
        .post('/incidents')
        .set('Authorization', 'Bearer client')
        .set('x-active-role', 'client')
        .send({ description: 'Dolor de hombro', severity: 'LOW' })
        .expect(201);
      expect(created.body.id).toBe(INCIDENT_ID);

      const answered = await http
        .post(`/incidents/${INCIDENT_ID}/respond`)
        .set('Authorization', 'Bearer coach-1')
        .set('x-active-role', 'coach')
        .send({ response: 'Baja la carga' })
        .expect(201);
      expect(answered.body.coachResponse).toBe('Baja la carga');

      await http
        .get(`/incidents/${INCIDENT_ID}`)
        .set('Authorization', 'Bearer coach-1')
        .set('x-active-role', 'coach')
        .expect(200);
      await http
        .get(`/incidents/${INCIDENT_ID}`)
        .set('Authorization', 'Bearer client')
        .set('x-active-role', 'client')
        .expect(200);
      await http
        .get(`/incidents/${INCIDENT_ID}`)
        .set('Authorization', 'Bearer coach-2')
        .set('x-active-role', 'coach')
        .expect(404);

      await http
        .post(`/incidents/${INCIDENT_ID}/respond`)
        .set('Authorization', 'Bearer coach-2')
        .set('x-active-role', 'coach')
        .send({ response: 'No deberia' })
        .expect(403);

      await http
        .post(`/incidents/${INCIDENT_ID}/respond`)
        .set('Authorization', 'Bearer admin')
        .set('x-active-role', 'admin')
        .send({ response: 'No deberia' })
        .expect(403);
    } finally {
      await app.close();
    }
  });
});

function createVerifier() {
  return {
    verify: async (token: string) => {
      if (token === 'admin') {
        return { email: 'admin@fitcoach.local', roles: ['admin'], subject: 'admin' };
      }
      if (token === 'client') {
        return { email: 'client@fitcoach.local', roles: ['client'], subject: 'client-1' };
      }
      return { email: `${token}@fitcoach.local`, roles: ['coach'], subject: token };
    },
  };
}

function createIncidentRepository() {
  let stored: IncidentView | null = null;
  return {
    addAdjustmentDraft: unused,
    addCoachResponse: async (context: AuthContext, incidentId: string, response: string) => {
      if (context.subject !== OWNER || !stored || stored.id !== incidentId) {
        throw new ForbiddenException('Incident access denied');
      }
      stored = { ...stored, coachResponse: response, status: 'REVIEWED' };
      return stored;
    },
    addTag: unused,
    archiveIncident: unused,
    createIncident: async (_context: AuthContext, input: CreateIncidentInput) => {
      stored = buildIncident(input);
      return stored;
    },
    getIncident: async (context: AuthContext, incidentId: string) => {
      if (!stored || stored.id !== incidentId || (context.subject !== OWNER && context.subject !== 'client-1')) {
        throw new NotFoundException('Incident not found');
      }
      return stored;
    },
    listActions: async () => [],
    listIncidents: async () => (stored ? [stored] : []),
    markReviewed: unused,
  };
}

function buildIncident(input: CreateIncidentInput): IncidentView {
  return {
    adjustmentDraft: null,
    clientId: '55555555-5555-4555-8555-555555555555',
    coachAlertedAt: null,
    coachMembershipId: 'membership-1',
    coachResponse: null,
    createdAt: new Date(),
    description: input.description,
    id: INCIDENT_ID,
    reviewedAt: null,
    sessionId: null,
    sessionItemId: null,
    severity: input.severity,
    status: 'OPEN',
    tag: null,
  };
}

function unused(): never {
  throw new Error('not used');
}
