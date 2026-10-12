import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en/common.json';
import es from '../i18n/locales/es/common.json';
import { resolveRouteTitleKey } from './route-title';
import { isRouteAllowed, SHELL_ROUTES, type ShellNavItem } from './usePersistentShellRoute';

const icon = () => null;
const COACH_MENU: ShellNavItem[] = [
  { icon, id: 'coach.clients', labelKey: 'app.nav.coach.clients' },
  { icon, id: 'coach.library.unified', labelKey: 'app.nav.coach.library.unified' },
];
const ADMIN_MENU: ShellNavItem[] = [{ icon, id: 'admin.coaches', labelKey: 'app.nav.admin.coaches' }];

describe('isRouteAllowed', () => {
  it('accepts routes that are in the menu', () => {
    expect(isRouteAllowed('coach.clients', COACH_MENU, 'coach')).toBe(true);
  });

  it('accepts valid sub-routes of the role that are not in the menu', () => {
    expect(isRouteAllowed('coach.progress', COACH_MENU, 'coach')).toBe(true);
    expect(isRouteAllowed('coach.library.warmups', COACH_MENU, 'coach')).toBe(true);
  });

  it('rejects routes that belong to another role', () => {
    expect(isRouteAllowed('admin.coaches', COACH_MENU, 'coach')).toBe(false);
    expect(isRouteAllowed('coach.progress', ADMIN_MENU, 'admin')).toBe(false);
  });
});

describe('route titles', () => {
  it.each(SHELL_ROUTES)('%s has a title in Spanish and English', (route) => {
    const key = resolveRouteTitleKey(route);
    expect((es as Record<string, string>)[key]).toBeTruthy();
    expect((en as Record<string, string>)[key]).toBeTruthy();
  });

  it('gives every route a different title in Spanish', () => {
    const titles = SHELL_ROUTES.map((route) => (es as Record<string, string>)[resolveRouteTitleKey(route)]);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
