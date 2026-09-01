import { buildPlanDayGroupLookup, mapExerciseGroupFields } from '../../../src/common/plan/plan-exercise-group.mapper';

describe('plan-exercise-group.mapper', () => {
  it('maps absent groups to null fields', () => {
    expect(mapExerciseGroupFields(null)).toEqual({ groupId: null, groupType: null });
  });

  it('maps plan exercise groups to API fields', () => {
    expect(mapExerciseGroupFields({ groupType: 'SUPERSET', id: 'group-1' })).toEqual({
      groupId: 'group-1',
      groupType: 'SUPERSET',
    });
  });

  it('builds a sortOrder lookup from all block types in a day', () => {
    const lookup = buildPlanDayGroupLookup({
      cardioBlocks: [{ group: { groupType: 'CIRCUIT', id: 'g-cardio' }, sortOrder: 3 }],
      exercises: [{ group: { groupType: 'SUPERSET', id: 'g-strength' }, sortOrder: 0 }],
      isometricBlocks: [],
      mobilityBlocks: [],
      plioBlocks: [{ group: null, sortOrder: 2 }],
      sportBlocks: [],
    });

    expect(lookup.get(0)).toEqual({ groupId: 'g-strength', groupType: 'SUPERSET' });
    expect(lookup.get(2)).toEqual({ groupId: null, groupType: null });
    expect(lookup.get(3)).toEqual({ groupId: 'g-cardio', groupType: 'CIRCUIT' });
  });
});
