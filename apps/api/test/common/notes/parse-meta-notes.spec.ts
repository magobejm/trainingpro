import { parseMetaNotes, stripMetaNotes } from '../../../src/common/notes/parse-meta-notes';
import { buildSessionNoteSnapshot } from '../../../src/common/notes/session-note-snapshot';
import { mapPlanSetsToPlannedSnapshots } from '../../../src/common/notes/planned-set.mapper';

describe('parseMetaNotes', () => {
  it('returns plain notes unchanged', () => {
    expect(stripMetaNotes('Pon la polea alta')).toBe('Pon la polea alta');
  });

  it('strips legacy meta suffix from trainer notes', () => {
    const raw = 'Nota visible\n[meta] {"repsPorSerie":"8,8,6"}';
    expect(parseMetaNotes(raw).baseNotes).toBe('Nota visible');
    expect(stripMetaNotes(raw)).toBe('Nota visible');
  });

  it('returns null for empty notes', () => {
    expect(stripMetaNotes(null)).toBeNull();
    expect(stripMetaNotes('   ')).toBeNull();
  });
});

describe('session note snapshot', () => {
  it('maps planned sets in order and strips meta from trainer note', () => {
    const snapshot = buildSessionNoteSnapshot({
      coachInstructions: '  Original instructions  ',
      notes: 'Trainer note\n[meta] {"repsPorSerie":"5"}',
      sets: [
        { setIndex: 1, note: 'Second set note', advancedTechnique: 'drop_set' },
        { setIndex: 0, note: 'First set note', advancedTechnique: null },
      ],
    });

    expect(snapshot.coachInstructions).toBe('Original instructions');
    expect(snapshot.notes).toBe('Trainer note');
    expect(snapshot.plannedSetsJson).toEqual([
      { setIndex: 0, note: 'First set note', advancedTechnique: null },
      { setIndex: 1, note: 'Second set note', advancedTechnique: 'drop_set' },
    ]);
    expect(mapPlanSetsToPlannedSnapshots(snapshot.plannedSetsJson as never)).toHaveLength(2);
  });
});
