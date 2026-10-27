import { describe, expect, it } from 'vitest';
import { countClientsWithOpenIncidents } from './useMenuBadges';

describe('countClientsWithOpenIncidents', () => {
  it('counts each client once', () => {
    expect(countClientsWithOpenIncidents([{ clientId: 'a' }, { clientId: 'a' }, { clientId: 'b' }])).toBe(2);
  });

  it('is zero when nobody has an open incident', () => {
    expect(countClientsWithOpenIncidents([])).toBe(0);
  });
});
