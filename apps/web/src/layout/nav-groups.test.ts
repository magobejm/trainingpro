import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en/common.json';
import es from '../i18n/locales/es/common.json';
import { buildNavSections, COACH_MENU_LAYOUT, formatBadge, resolveActiveNavRoute } from './nav-groups';
import type { ShellNavItem, ShellRoute } from './usePersistentShellRoute';

const icon = () => null;
const item = (id: ShellRoute): ShellNavItem => ({ group: 'clients', icon, id, labelKey: `app.nav.${id}` });

describe('COACH_MENU_LAYOUT', () => {
  it('organizes the 13 screens into four blocks', () => {
    expect(COACH_MENU_LAYOUT.map((entry) => entry.group)).toEqual(['clients', 'planning', 'library', 'tools']);
    expect(COACH_MENU_LAYOUT.flatMap((entry) => entry.routes)).toHaveLength(13);
  });

  it('does not repeat a screen', () => {
    const routes = COACH_MENU_LAYOUT.flatMap((entry) => entry.routes);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('puts the screens of each block where the design says', () => {
    const byGroup = Object.fromEntries(COACH_MENU_LAYOUT.map((entry) => [entry.group, entry.routes]));
    expect(byGroup.clients).toEqual(['coach.clients', 'coach.chat', 'coach.notes', 'coach.incidents', 'coach.calendar']);
    expect(byGroup.library).toEqual(['coach.library.unified', 'coach.library.foods']);
    expect(byGroup.tools).toEqual(['coach.evaluator', 'coach.notifications']);
  });

  it('has a Spanish and an English title for every block', () => {
    for (const { group } of COACH_MENU_LAYOUT) {
      expect((es as Record<string, string>)[`app.nav.group.${group}`]).toBeTruthy();
      expect((en as Record<string, string>)[`app.nav.group.${group}`]).toBeTruthy();
    }
  });
});

describe('buildNavSections', () => {
  it('orders the items by block and keeps the order inside each block', () => {
    const sections = buildNavSections([item('coach.notes'), item('coach.library.foods'), item('coach.clients')]);
    expect(sections.map((section) => section.group)).toEqual(['clients', 'library']);
    expect(sections[0]?.items.map((entry) => entry.id)).toEqual(['coach.clients', 'coach.notes']);
  });

  it('leaves out empty blocks', () => {
    expect(buildNavSections([item('coach.evaluator')]).map((section) => section.group)).toEqual(['tools']);
  });

  it('keeps screens that are not in any block at the end', () => {
    const sections = buildNavSections([item('admin.coaches'), item('coach.clients')]);
    expect(sections.at(-1)?.items.map((entry) => entry.id)).toEqual(['admin.coaches']);
  });
});

describe('formatBadge', () => {
  it('shows nothing when there is nothing pending', () => {
    expect(formatBadge(undefined)).toBeNull();
    expect(formatBadge(0)).toBeNull();
  });

  it('shows the number, capped at 99+', () => {
    expect(formatBadge(3)).toBe('3');
    expect(formatBadge(99)).toBe('99');
    expect(formatBadge(100)).toBe('99+');
  });
});

describe('resolveActiveNavRoute', () => {
  it('highlights Clientes while looking at the progress of a client', () => {
    expect(resolveActiveNavRoute('coach.progress')).toBe('coach.clients');
  });

  it('leaves every other screen as it is', () => {
    expect(resolveActiveNavRoute('coach.chat')).toBe('coach.chat');
  });
});

describe('short menu labels', () => {
  it('has a Spanish and an English label for every screen of the coach menu', () => {
    for (const route of COACH_MENU_LAYOUT.flatMap((entry) => entry.routes)) {
      expect((es as Record<string, string>)[`app.menu.${route}`]).toBeTruthy();
      expect((en as Record<string, string>)[`app.menu.${route}`]).toBeTruthy();
    }
  });
});
