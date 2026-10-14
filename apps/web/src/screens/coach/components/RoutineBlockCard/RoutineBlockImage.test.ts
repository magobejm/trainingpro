import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BlockType } from '../../RoutinePlanner.types';
import { getFullUrl, resolvePlaceholder } from '../RoutinePlanner/ExercisePickerModal.utils';
import { RoutineBlockImage } from './RoutineBlockImage';

const library = vi.hoisted(() => ({ data: [] as { id: string; mediaUrl: string | null }[] }));
vi.mock('../../../../data/hooks/useUnifiedLibraryQuery', () => ({ useUnifiedExercisesQuery: () => library }));
vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-native')>()),
  Image: ({ source }: { source: { uri: string } }) => React.createElement('img', { src: source.uri }),
}));

const types: BlockType[] = ['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport'];

describe('routine exercise images', () => {
  it.each(types)('shows the assigned library image for a saved %s block', (type) => {
    const url = 'https://media.example.com/exercise.png?signature=private-image';
    library.data = [
      { id: 'another-exercise', mediaUrl: 'https://media.example.com/wrong.png' },
      { id: 'exercise-id', mediaUrl: url },
    ];
    const html = renderToStaticMarkup(React.createElement(RoutineBlockImage, { block: { type, libraryId: 'exercise-id' } }));
    expect(html).toContain(url);
    expect(html).not.toContain(resolvePlaceholder(type));
    expect(html).not.toContain('wrong.png');
  });

  it.each([null, '', '   '])('uses the placeholder when the assigned image is %s', (mediaUrl) => {
    library.data = [{ id: 'exercise-id', mediaUrl }];
    const html = renderToStaticMarkup(
      React.createElement(RoutineBlockImage, { block: { type: 'strength', libraryId: 'exercise-id' } }),
    );
    expect(html).toContain(resolvePlaceholder('strength'));
  });

  it('does not borrow the image of a different exercise', () => {
    library.data = [{ id: 'different-id', mediaUrl: 'https://media.example.com/wrong.png' }];
    const html = renderToStaticMarkup(
      React.createElement(RoutineBlockImage, { block: { type: 'mobility', libraryId: 'missing-id' } }),
    );
    expect(html).toContain(resolvePlaceholder('mobility'));
    expect(html).not.toContain('wrong.png');
  });

  it('resolves relative image URLs against the configured API', () => {
    library.data = [{ id: 'exercise-id', mediaUrl: '/assets/exercise.jpg' }];
    const html = renderToStaticMarkup(
      React.createElement(RoutineBlockImage, { block: { type: 'strength', libraryId: 'exercise-id' } }),
    );
    expect(html).toContain(getFullUrl('strength', '/assets/exercise.jpg'));
  });
});
