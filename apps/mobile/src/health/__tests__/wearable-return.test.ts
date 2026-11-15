import { readWearableReturn } from '../wearable-return';

describe('readWearableReturn', () => {
  it('reads a successful Garmin return', () => {
    expect(readWearableReturn('trainerpro://integrations/garmin?status=ok')).toEqual({
      provider: 'garmin',
      status: 'ok',
    });
  });

  it('ignores an unrelated link', () => {
    expect(readWearableReturn('trainerpro://workout/today')).toBeNull();
    expect(readWearableReturn('https://trainerpro-prod.web.app')).toBeNull();
  });
});
