import { selectClients } from '../../src/modules/clients/domain/list-clients.query';
import type { Client } from '../../src/modules/clients/domain/client';

function client(partial: Pick<Client, 'firstName' | 'id' | 'lastName'> & Partial<Client>): Client {
  return {
    allergies: null,
    avatarUrl: null,
    birthDate: null,
    coachMembershipId: 'coach',
    considerations: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    email: `${partial.id}@example.com`,
    fcMax: null,
    fcRest: null,
    fitnessLevel: null,
    heightCm: null,
    hipCm: null,
    injuries: null,
    lastActivityAt: null,
    notes: null,
    objective: 'Fuerza',
    objectiveId: 'obj',
    organizationId: 'org',
    phone: null,
    progressPhotos: [],
    secondaryObjectives: [],
    sex: null,
    trainingPlanId: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    waistCm: null,
    weightKg: null,
    ...partial,
  };
}

const clients = [
  client({ firstName: 'José', id: '2', lastActivityAt: new Date('2026-02-01T00:00:00.000Z'), lastName: 'Álvarez' }),
  client({
    firstName: 'Ana',
    id: '1',
    lastActivityAt: new Date('2026-03-01T00:00:00.000Z'),
    lastName: 'Ruiz',
    objective: 'Salud',
  }),
  client({ firstName: 'Luis', id: '3', lastName: 'Paz' }),
];

describe('selectClients', () => {
  it('encuentra nombres con tildes', () => {
    const found = selectClients(clients, { search: 'jose alvarez', sort: 'name' });
    expect(found.map((item) => item.id)).toEqual(['2']);
  });

  it('ordena por actividad reciente y deja al final a quien no tiene', () => {
    const found = selectClients(clients, { sort: 'activity' });
    expect(found.map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('filtra por objetivo', () => {
    const found = selectClients(clients, { objective: 'Salud', sort: 'name' });
    expect(found.map((item) => item.id)).toEqual(['1']);
  });
});
