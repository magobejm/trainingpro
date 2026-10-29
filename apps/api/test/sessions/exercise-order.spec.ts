import { NotFoundException } from '@nestjs/common';
import {
  completionOrderFor,
  nextExerciseOrder,
  stampCompletionOrder,
} from '../../src/modules/sessions/domain/exercise-order';

describe('exercise completion order', () => {
  it('keeps the first number when the same exercise is finished again', () => {
    const once = nextExerciseOrder([], 'item-a', true);
    const twice = nextExerciseOrder(once, 'item-a', true);
    expect(twice).toEqual(['item-a']);
    expect(completionOrderFor(twice, 'item-a')).toBe(1);
  });

  it('rejects an exercise that does not belong to the session', () => {
    expect(() => nextExerciseOrder(['item-a'], 'other-session-item', false)).toThrow(NotFoundException);
  });

  it('numbers exercises by finish time while leaving the list order unchanged', () => {
    const order = nextExerciseOrder(nextExerciseOrder([], 'row', true), 'squat', true);
    const items = stampCompletionOrder(
      [
        { id: 'squat', name: 'Sentadilla' },
        { id: 'row', name: 'Remo' },
        { id: 'press', name: 'Press' },
      ],
      order,
    );
    expect(items.map((item) => [item.name, item.completionOrder])).toEqual([
      ['Sentadilla', 2],
      ['Remo', 1],
      ['Press', null],
    ]);
  });
});
