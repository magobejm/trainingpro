import { describe, expect, it } from 'vitest';
import { buildClientCrumbs } from './crumbs';

const t = (key: string): string => key;

describe('buildClientCrumbs', () => {
  it('shows Clientes › Name › Screen with a link on every level except the last', () => {
    const crumbs = buildClientCrumbs({ clientId: 'abc', clientName: 'Ana López', mode: 'progress', t });
    expect(crumbs).toEqual([
      { label: 'coach.clients.title', to: '/coach/clients' },
      { label: 'Ana López', to: '/coach/clients/abc' },
      { label: 'app.nav.coach.progress', to: null },
    ]);
  });

  it('does not link the client when you are already in the profile', () => {
    const crumbs = buildClientCrumbs({ clientId: 'abc', clientName: 'Ana López', mode: 'profile', t });
    expect(crumbs).toEqual([
      { label: 'coach.clients.title', to: '/coach/clients' },
      { label: 'Ana López', to: null },
    ]);
  });

  it.each([
    ['edit', 'coach.clientProfile.edit.title'],
    ['nutrition', 'coach.nutrition.client.title'],
    ['mood', 'coach.clientProfile.details.mood.title'],
    ['tests', 'coach.clientProfile.details.tests.title'],
  ] as const)('labels the %s screen', (mode, key) => {
    expect(buildClientCrumbs({ clientId: 'abc', clientName: 'Ana', mode, t }).at(-1)).toEqual({ label: key, to: null });
  });

  it('falls back to the section name while the client name is still loading', () => {
    const crumbs = buildClientCrumbs({ clientId: 'abc', clientName: '  ', mode: 'tests', t });
    expect(crumbs[1]?.label).toBe('coach.clients.title');
  });

  it('encodes the client id in the links', () => {
    const crumbs = buildClientCrumbs({ clientId: 'a b', clientName: 'Ana', mode: 'edit', t });
    expect(crumbs[1]?.to).toBe('/coach/clients/a%20b');
  });
});
