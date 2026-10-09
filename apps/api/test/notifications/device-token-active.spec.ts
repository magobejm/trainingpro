import { deviceTokenIsActive } from '../../src/modules/notifications/domain/device-token-active';

describe('device token active flag', () => {
  it('keeps the token active unless the client says it is disabled', () => {
    expect(deviceTokenIsActive(undefined)).toBe(true);
    expect(deviceTokenIsActive(true)).toBe(true);
    expect(deviceTokenIsActive(false)).toBe(false);
  });
});
