import { describe, expect, it } from 'vitest';
import { filterByQuery } from './ExercisePickerModal.utils';
import { pickerLibraryFilter, PICKER_FILTERS } from './ExercisePickerModal.filters';
import type { LibraryItem } from './ExercisePickerModal.types';
import type { BlockType } from '../../RoutinePlanner.types';

const items: LibraryItem[] = ['Press inclinado con mancuernas', 'Extensión de tríceps', 'Sentadilla frontal'].map(
  (name, index) => ({
    id: String(index),
    name,
    description: null,
    notes: null,
    imageUrl: null,
    youtubeUrl: null,
  }),
);

describe('routine exercise picker search', () => {
  it('matches words in any order with words between them', () => {
    expect(filterByQuery(items, 'mancuernas PRESS').map((item) => item.name)).toEqual(['Press inclinado con mancuernas']);
    expect(filterByQuery(items, 'press mancuernas').map((item) => item.name)).toEqual(['Press inclinado con mancuernas']);
  });
  it('ignores accents, punctuation and repeated whitespace, requiring every word', () => {
    expect(filterByQuery(items, '  TRICEPS   extension! ')[0]?.name).toBe('Extensión de tríceps');
    expect(filterByQuery(items, 'mancuernas sentadilla')).toEqual([]);
    expect(filterByQuery(items, ' ')).toEqual(items);
  });
  it('uses the library category and filter for every block type without leaking other categories', () => {
    for (const type of Object.keys(PICKER_FILTERS) as BlockType[]) {
      const config = PICKER_FILTERS[type];
      expect(pickerLibraryFilter(type, { categoryIds: ['selected'], equipmentIds: [] })).toEqual({
        baseCategory: config.catalog,
        [config.filter]: ['selected'],
      });
    }
    expect(pickerLibraryFilter('mobility', { categoryIds: [], equipmentIds: [] })).toEqual({
      baseCategory: 'mobilityTypes',
      mobilityTypeIds: [],
    });
  });
});
