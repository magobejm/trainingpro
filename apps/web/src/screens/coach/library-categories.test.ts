import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ query: '', catalogError: false }));
const items = [
  {
    id: 'one',
    name: 'Sprint',
    scope: 'coach',
    description: 'Description',
    equipment: '',
    youtubeUrl: null,
    media: { url: null },
    mediaUrl: null,
    icon: '🏆',
    isometricType: 'undefined',
    plioType: 'undefined',
    mobilityType: 'undefined',
  },
  { id: 'two', name: 'Run', scope: 'coach', description: '', youtubeUrl: null, mediaUrl: null, icon: '🏆' },
];
const list = () => ({ data: items, isLoading: false, isError: false, error: null, refetch: vi.fn() });
const catalog = () => ({
  data: [{ id: 'undefined', label: 'Undefined' }],
  isLoading: false,
  isError: state.catalogError,
  error: state.catalogError ? new Error('Unavailable') : null,
  refetch: vi.fn(),
});
vi.mock('../../layout/useListContext', () => ({
  useQueryFilter: () => ({ activeFilter: 'all', query: state.query, setActiveFilter: vi.fn(), setQuery: vi.fn() }),
}));
vi.mock('../../data/hooks/useLibraryQuery', () => ({
  useLibraryIsometricExercisesQuery: () => list(),
  useLibraryPlioExercisesQuery: () => list(),
  useLibraryMobilityExercisesQuery: () => list(),
  useLibrarySportsQuery: () => list(),
  useLibraryIsometricTypesQuery: () => catalog(),
  useLibraryPlioTypesQuery: () => catalog(),
  useLibraryMobilityTypesQuery: () => catalog(),
}));
vi.mock('../../data/hooks/useLibrarySpecializedMutations', () => {
  const mutations = Object.fromEntries(
    ['IsometricExercise', 'PlioExercise', 'MobilityExercise', 'Sport'].flatMap((category) =>
      ['Create', 'Update', 'Delete'].map((action) => [
        'use' + action + category + 'Mutation',
        () => ({ isPending: false, mutateAsync: vi.fn() }),
      ]),
    ),
  );
  return mutations;
});
vi.mock('../../data/hooks/useLibraryMediaMutations', () => ({
  useUploadLibraryImageMutation: () => ({ isPending: false }),
}));
import i18n from '../../i18n';
import { LibraryIsometricScreen } from './LibraryIsometricScreen';
import { LibraryPlioScreen } from './LibraryPlioScreen';
import { LibraryMobilityScreen } from './LibraryMobilityScreen';
import { LibrarySportsScreen } from './LibrarySportsScreen';
describe('library categories', () => {
  it.each([LibraryIsometricScreen, LibraryPlioScreen, LibraryMobilityScreen, LibrarySportsScreen])(
    'renders items and a creation action for %s',
    (Screen) => {
      state.query = '';
      state.catalogError = false;
      const html = renderToStaticMarkup(React.createElement(Screen));
      expect(html).toContain('Sprint');
      expect(html).toContain(i18n.t('coach.library.actions.create'));
    },
  );
  it('filters sports by name without requiring unsupported server filters', () => {
    state.query = 'sprint';
    const html = renderToStaticMarkup(React.createElement(LibrarySportsScreen));
    expect(html).toContain('Sprint');
    expect(html).not.toContain('>Run<');
  });
  it('shows a retry action when category catalogs fail', () => {
    state.query = '';
    state.catalogError = true;
    const html = renderToStaticMarkup(React.createElement(LibraryMobilityScreen));
    expect(html).toContain(i18n.t('coach.status.retry'));
    expect(html).not.toContain('>Sprint<');
  });
});
