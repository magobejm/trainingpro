import { describe, expect, it } from 'vitest';
import {
  clientPath,
  defaultPathForRole,
  isPathAllowedForRole,
  parseShellPath,
  routeToPath,
  SHELL_PATHS,
} from './shell-routes';
import { SHELL_ROUTES } from './usePersistentShellRoute';

describe('SHELL_PATHS', () => {
  it('gives every screen its own address', () => {
    const paths = SHELL_ROUTES.map((route) => SHELL_PATHS[route]);
    expect(paths).toHaveLength(SHELL_ROUTES.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps coach and admin screens under their own prefix', () => {
    for (const route of SHELL_ROUTES) {
      const prefix = route.startsWith('admin.') ? '/admin/' : '/coach/';
      expect(SHELL_PATHS[route].startsWith(prefix)).toBe(true);
    }
  });

  it.each(SHELL_ROUTES)('%s survives a round trip', (route) => {
    expect(parseShellPath(routeToPath(route))).toEqual({ clientId: null, clientMode: null, route });
  });
});

describe('client addresses', () => {
  it('builds the profile address and the sub-screen addresses', () => {
    expect(routeToPath('coach.clients', { clientId: 'abc' })).toBe('/coach/clients/abc');
    expect(routeToPath('coach.clients', { clientId: 'abc', clientMode: 'edit' })).toBe('/coach/clients/abc/edit');
    expect(clientPath('abc', 'tests')).toBe('/coach/clients/abc/tests');
  });

  it('puts progress under the client', () => {
    expect(routeToPath('coach.progress', { clientId: 'abc' })).toBe('/coach/clients/abc/progress');
    expect(routeToPath('coach.progress')).toBe('/coach/progress');
  });

  it('ignores the client for screens that are not client-specific', () => {
    expect(routeToPath('coach.calendar', { clientId: 'abc' })).toBe('/coach/calendar');
  });

  it('reads them back', () => {
    expect(parseShellPath('/coach/clients/abc')).toEqual({ clientId: 'abc', clientMode: null, route: 'coach.clients' });
    expect(parseShellPath('/coach/clients/abc/mood')).toEqual({
      clientId: 'abc',
      clientMode: 'mood',
      route: 'coach.clients',
    });
    expect(parseShellPath('/coach/clients/abc/progress')).toEqual({
      clientId: 'abc',
      clientMode: 'progress',
      route: 'coach.progress',
    });
  });

  it('encodes ids that are not URL safe and decodes them again', () => {
    const path = clientPath('a b/c', 'edit');
    expect(path).toBe('/coach/clients/a%20b%2Fc/edit');
    expect(parseShellPath(path)?.clientId).toBe('a b/c');
  });

  it.each([
    '/coach/clients/abc/unknown',
    '/coach/clients/abc/edit/extra',
    '/coach/clients/%E0%A4%A',
    '/coach/clients//edit',
  ])('rejects %s', (path) => {
    expect(parseShellPath(path)).toBeNull();
  });
});

describe('legacy addresses', () => {
  it.each([
    '/coach/library/strength',
    '/coach/library/cardio',
    '/coach/library/isometrics',
    '/coach/library/plyometrics',
    '/coach/library/mobility',
    '/coach/library/sports',
  ])('sends %s to the unified library', (path) => {
    expect(parseShellPath(path)?.route).toBe('coach.library.unified');
  });

  it.each(['/coach/builder/strength', '/coach/builder/cardio', '/coach/builder/diet'])(
    'sends %s to the routine planner',
    (path) => {
      expect(parseShellPath(path)?.route).toBe('coach.routine.planner');
    },
  );
});

describe('unknown addresses', () => {
  it('ignores a trailing slash', () => {
    expect(parseShellPath('/coach/notes/')?.route).toBe('coach.notes');
  });

  it.each(['/', '/login', '/coach', '/coach/unknown', '/admin'])('does not know %s', (path) => {
    expect(parseShellPath(path)).toBeNull();
  });
});

describe('roles', () => {
  it('sends each role to its home screen', () => {
    expect(defaultPathForRole('coach')).toBe('/coach/home');
    expect(defaultPathForRole('admin')).toBe('/admin/coaches');
  });

  it('only allows the screens of the active role', () => {
    expect(isPathAllowedForRole('/coach/calendar', 'coach')).toBe(true);
    expect(isPathAllowedForRole('/coach/clients/abc/progress', 'coach')).toBe(true);
    expect(isPathAllowedForRole('/admin/coaches', 'coach')).toBe(false);
    expect(isPathAllowedForRole('/coach/calendar', 'admin')).toBe(false);
    expect(isPathAllowedForRole('/nowhere', 'coach')).toBe(false);
  });
});
