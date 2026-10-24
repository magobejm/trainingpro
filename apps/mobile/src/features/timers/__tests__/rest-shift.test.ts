import { restItemId, shiftRest, shouldAutoStartRest } from '../rest-shift';

const rest = {
  endAt: 1_000_000,
  expanded: true,
  lastSeenAt: 970_000,
  seconds: 60,
  setKey: 'item-1:2',
};

describe('shiftRest', () => {
  const now = 985_000;

  it('adds fifteen seconds to the end and the planned total', () => {
    const shifted = shiftRest(rest, 15, now);
    expect(shifted.endAt).toBe(rest.endAt + 15_000);
    expect(shifted.seconds).toBe(75);
    expect(shifted.lastSeenAt).toBe(now);
    expect(shifted.setKey).toBe(rest.setKey);
  });

  it('stops at zero instead of moving the end before now', () => {
    const shifted = shiftRest(rest, -30, now);
    expect(shifted.endAt).toBe(now);
    expect(shifted.seconds).toBe(45);
  });
});

describe('restItemId', () => {
  it('reads the exercise id before the last colon', () => {
    expect(restItemId('item:1:3')).toBe('item:1');
    expect(restItemId('item')).toBeNull();
  });
});

describe('shouldAutoStartRest', () => {
  const ready = { enabled: true, readOnly: false, restActive: false, restDone: false, restSeconds: 60 };

  it('starts after a saved set when the switch is on', () => {
    expect(shouldAutoStartRest(ready)).toBe(true);
  });

  it('stays off when the switch, a running rest, or a finished rest says so', () => {
    expect(shouldAutoStartRest({ ...ready, enabled: false })).toBe(false);
    expect(shouldAutoStartRest({ ...ready, restActive: true })).toBe(false);
    expect(shouldAutoStartRest({ ...ready, restDone: true })).toBe(false);
    expect(shouldAutoStartRest({ ...ready, readOnly: true })).toBe(false);
    expect(shouldAutoStartRest({ ...ready, restSeconds: 0 })).toBe(false);
  });
});
