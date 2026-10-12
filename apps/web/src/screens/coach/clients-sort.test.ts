import { describe, expect, it } from 'vitest';
import { sortClients } from './clients-sort';
const clients = [
  { id: 'a', firstName: 'Ana', lastName: 'Z', lastActivityAt: null },
  { id: 'b', firstName: 'Bea', lastName: 'A', lastActivityAt: '2026-10-11T12:00:00Z' },
  { id: 'c', firstName: 'Carlos', lastName: 'B', lastActivityAt: '2026-10-12T12:00:00Z' },
];
describe('client ordering', () => {
  it('orders names without mutating the source', () => {
    expect(sortClients(clients, 'name').map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(clients[0]!.id).toBe('a');
  });
  it('puts recent training first and missing activity last', () => {
    expect(sortClients(clients, 'activity').map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });
  it('breaks ties by name and handles invalid or absent timestamps', () => {
    expect(
      sortClients(
        [
          { ...clients[1]!, lastActivityAt: 'invalid' },
          { ...clients[0]!, lastActivityAt: undefined },
        ],
        'activity',
      ).map((c) => c.id),
    ).toEqual(['a', 'b']);
  });
});
