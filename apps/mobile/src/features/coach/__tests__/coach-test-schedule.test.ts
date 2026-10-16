import { testForCoachSchedule } from '../coach-test-schedule';
import type { PhysicalTestView } from '../../../data/hooks/usePhysicalTests';

describe('coach scheduled physical tests', () => {
  it('resolves the coach compact response through the catalog instead of expecting a nested physicalTest', () => {
    const test = { id: 'test-a', name: 'Plancha' } as PhysicalTestView;
    expect(testForCoachSchedule({ physicalTestId: 'test-a' }, [test])).toBe(test);
    expect(testForCoachSchedule({ physicalTestId: 'deleted' }, [test])).toBeUndefined();
  });
});
