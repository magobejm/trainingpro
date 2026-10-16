import {
  clientFormPayload,
  emptyClientForm,
  filterCoachClients,
  canRespondToCall,
  isOwnChatMessage,
} from '../coach-client-model';
describe('coach client model', () => {
  it('sorts tied activity by name and filters archived independently', () => {
    const rows = [
      { id: 'b', firstName: 'Bea', lastName: 'B', email: 'b', lastActivityAt: '2026-10-10', archivedAt: null },
      { id: 'a', firstName: 'Ana', lastName: 'A', email: 'a', lastActivityAt: '2026-10-10', archivedAt: null },
      { id: 'c', firstName: 'Carlos', lastName: 'C', email: 'c', lastActivityAt: null, archivedAt: '2026-10-11' },
    ];
    expect(filterCoachClients(rows, '', 'active', 'activity').map((x) => x.id)).toEqual(['a', 'b']);
    expect(filterCoachClients(rows, 'carlos', 'archived', 'name').map((x) => x.id)).toEqual(['c']);
  });
  it('omits empty creation dates, preserves numeric zero, rejects invalid numbers', () => {
    const form = { ...emptyClientForm, firstName: ' Ana ', lastName: ' A ', email: 'a@test.es', heightCm: '170' };
    expect(clientFormPayload(form, false)).toMatchObject({ firstName: 'Ana', heightCm: 170 });
    expect(clientFormPayload(form, false)).not.toHaveProperty('birthDate');
    expect(() => clientFormPayload({ ...form, weightKg: 'no' }, false)).toThrow();
  });
  it('derives call permissions and own bubbles from active role', () => {
    expect(canRespondToCall('coach', { status: 'pending', lastProposedBy: 'CLIENT' })).toBe(true);
    expect(canRespondToCall('coach', { status: 'pending', lastProposedBy: 'COACH' })).toBe(false);
    expect(canRespondToCall('client', { status: 'cancelled', lastProposedBy: 'COACH' })).toBe(false);
    expect(isOwnChatMessage('coach', 'COACH')).toBe(true);
    expect(isOwnChatMessage('coach', 'CLIENT')).toBe(false);
  });
});
