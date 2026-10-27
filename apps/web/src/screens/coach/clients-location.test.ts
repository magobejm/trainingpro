import { describe, expect, it } from 'vitest';
import { clientsScreenPath, readClientsLocation, type ScreenMode } from './clients-location';

describe('readClientsLocation', () => {
  it('shows the list on /coach/clients', () => {
    expect(readClientsLocation('/coach/clients')).toEqual({ screenMode: 'list', selectedClientId: '' });
  });

  it('shows the profile of the client in the address', () => {
    expect(readClientsLocation('/coach/clients/abc')).toEqual({ screenMode: 'profile', selectedClientId: 'abc' });
  });

  it.each([
    ['compare', 'compare'],
    ['edit', 'profileEdit'],
    ['nutrition', 'nutrition'],
    ['mood', 'mood'],
    ['measures', 'measures'],
    ['planning', 'planning'],
    ['tests', 'tests'],
    ['volume', 'volume'],
  ] as const)('maps /%s to the %s screen', (segment, mode) => {
    expect(readClientsLocation(`/coach/clients/abc/${segment}`)).toEqual({ screenMode: mode, selectedClientId: 'abc' });
  });

  it('is not the clients screen for the progress of a client or for other sections', () => {
    expect(readClientsLocation('/coach/clients/abc/progress')).toEqual({ screenMode: 'list', selectedClientId: '' });
    expect(readClientsLocation('/coach/calendar')).toEqual({ screenMode: 'list', selectedClientId: '' });
  });
});

describe('clientsScreenPath', () => {
  it('builds the address of each screen', () => {
    expect(clientsScreenPath('abc', 'profile')).toBe('/coach/clients/abc');
    expect(clientsScreenPath('abc', 'profileEdit')).toBe('/coach/clients/abc/edit');
    expect(clientsScreenPath('abc', 'tests')).toBe('/coach/clients/abc/tests');
  });

  it('goes to the list without a client or in list mode', () => {
    expect(clientsScreenPath('', 'profile')).toBe('/coach/clients');
    expect(clientsScreenPath('abc', 'list')).toBe('/coach/clients');
  });

  it.each([
    'profile',
    'profileEdit',
    'nutrition',
    'mood',
    'tests',
    'compare',
    'measures',
    'planning',
    'volume',
  ] as ScreenMode[])('round-trips the %s screen', (mode) => {
    expect(readClientsLocation(clientsScreenPath('abc', mode))).toEqual({ screenMode: mode, selectedClientId: 'abc' });
  });
});
