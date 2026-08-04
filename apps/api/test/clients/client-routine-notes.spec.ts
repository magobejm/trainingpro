import { mapPlanSetsToPlannedSnapshots } from '../../src/common/notes/planned-set.mapper';
import { stripMetaNotes } from '../../src/common/notes/parse-meta-notes';

describe('client routine note mapping helpers', () => {
  it('exposes trainer note, library instructions and ordered set notes separately', () => {
    const coachInstructions = 'Library setup text';
    const notes = stripMetaNotes('Trainer note\n[meta] {"repsPorSerie":"8,8,6"}');
    const sets = mapPlanSetsToPlannedSnapshots([
      { setIndex: 1, note: 'Set 2 note', advancedTechnique: 'rest_pause' },
      { setIndex: 0, note: null, advancedTechnique: 'cluster' },
    ]);

    expect(coachInstructions).toBe('Library setup text');
    expect(notes).toBe('Trainer note');
    expect(sets).toEqual([
      { setIndex: 0, note: null, advancedTechnique: 'cluster' },
      { setIndex: 1, note: 'Set 2 note', advancedTechnique: 'rest_pause' },
    ]);
  });
});
