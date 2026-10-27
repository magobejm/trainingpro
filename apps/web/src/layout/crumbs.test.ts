import { describe, expect, it } from 'vitest';
import { buildClientCrumbs, buildLibraryPlannerCrumbs, buildProgressDrillCrumbs } from './crumbs';

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
    ['chat', 'coach.clientProfile.details.chat.title'],
    ['incidents', 'coach.clientProfile.details.incidents.title'],
    ['routine', 'coach.routine.title'],
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

describe('buildProgressDrillCrumbs', () => {
  const base = buildClientCrumbs({ clientId: 'abc', clientName: 'Ana', mode: 'progress', t });
  const onProgress = (): void => undefined;
  const onRoutine = (): void => undefined;

  it('keeps the progress trail when nothing is open', () => {
    expect(buildProgressDrillCrumbs({ base, exerciseLabel: null, onProgress, onRoutine, routineLabel: null })).toBe(base);
  });

  it('links Progreso and marks the routine as the current page', () => {
    const crumbs = buildProgressDrillCrumbs({ base, exerciseLabel: null, onProgress, onRoutine, routineLabel: 'Full Body' });
    expect(crumbs.at(-2)).toMatchObject({ label: 'app.nav.coach.progress', onPress: onProgress, to: null });
    expect(crumbs.at(-1)).toEqual({ label: 'Full Body', to: null });
  });

  it('links the routine when an exercise of that routine is open', () => {
    const crumbs = buildProgressDrillCrumbs({
      base,
      exerciseLabel: 'Sentadilla',
      onProgress,
      onRoutine,
      routineLabel: 'Full Body',
    });
    expect(crumbs.at(-2)).toMatchObject({ label: 'Full Body', onPress: onRoutine, to: null });
    expect(crumbs.at(-1)).toEqual({ label: 'Sentadilla', to: null });
  });

  it('links Progreso when the exercise comes from the history', () => {
    const crumbs = buildProgressDrillCrumbs({
      base,
      exerciseLabel: 'Sentadilla',
      onProgress,
      onRoutine,
      routineLabel: null,
    });
    expect(crumbs.map((crumb) => crumb.label)).toEqual([
      'coach.clients.title',
      'Ana',
      'app.nav.coach.progress',
      'Sentadilla',
    ]);
    expect(crumbs[2]?.onPress).toBe(onProgress);
  });
});

describe('buildLibraryPlannerCrumbs', () => {
  it('links the routine library and marks the planner as the current page', () => {
    expect(buildLibraryPlannerCrumbs({ kind: 'routine', t })).toEqual([
      { label: 'coach.routineLib.title', to: '/coach/library/routines' },
      { label: 'coach.routine.title', to: null },
    ]);
  });

  it('links the warmup library and marks the warmup planner as the current page', () => {
    expect(buildLibraryPlannerCrumbs({ kind: 'warmup', t })).toEqual([
      { label: 'coach.routineLib.title', to: '/coach/library/warmups' },
      { label: 'coach.warmupPlanner.title', to: null },
    ]);
  });
});
