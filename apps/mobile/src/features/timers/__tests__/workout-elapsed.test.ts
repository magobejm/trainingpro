import { formatWorkoutElapsed } from '../workout-elapsed';

describe('formatWorkoutElapsed', () => {
  it('keeps minutes and seconds before the hour', () => {
    expect(formatWorkoutElapsed(9 * 60 + 49)).toBe('09:49');
    expect(formatWorkoutElapsed(21 * 60 + 6)).toBe('21:06');
    expect(formatWorkoutElapsed(59 * 60 + 59)).toBe('59:59');
  });

  it('switches to hours and minutes once it passes an hour', () => {
    expect(formatWorkoutElapsed(60 * 60)).toBe('1h 0 min');
    expect(formatWorkoutElapsed(68 * 60 + 15)).toBe('1h 8 min');
    expect(formatWorkoutElapsed(2 * 3600 + 5 * 60)).toBe('2h 5 min');
  });
});
