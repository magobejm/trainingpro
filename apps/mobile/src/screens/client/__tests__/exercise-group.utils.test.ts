import { buildExerciseBlocks } from '../exercise-group.utils';

describe('buildExerciseBlocks', () => {
  it('sorts singles by sortOrder', () => {
    const blocks = buildExerciseBlocks([
      { groupId: null, groupType: null, id: 'a', sortOrder: 2 },
      { groupId: null, groupType: null, id: 'b', sortOrder: 1 },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.type).toBe('single');
    expect(blocks[0]?.exercises[0]?.id).toBe('b');
    expect(blocks[1]?.exercises[0]?.id).toBe('a');
  });

  it('builds superset and circuit blocks', () => {
    const blocks = buildExerciseBlocks([
      { groupId: 'g1', groupType: 'SUPERSET', id: 'a', sortOrder: 1 },
      { groupId: 'g1', groupType: 'SUPERSET', id: 'b', sortOrder: 2 },
      { groupId: null, groupType: null, id: 'c', sortOrder: 3 },
      { groupId: 'g2', groupType: 'CIRCUIT', id: 'd', sortOrder: 4 },
      { groupId: 'g2', groupType: 'CIRCUIT', id: 'e', sortOrder: 5 },
    ]);

    expect(blocks).toHaveLength(3);
    expect(blocks[0]?.type).toBe('superset');
    expect(blocks[0]?.exercises).toHaveLength(2);
    expect(blocks[1]?.type).toBe('single');
    expect(blocks[2]?.type).toBe('circuit');
  });
});
