import { isNativeRecoveryUrl, resolvePasswordResetRedirect } from '../password-reset-redirect';

describe('resolvePasswordResetRedirect', () => {
  const createUrl = (path: string): string => `trainerpro://${path}`;

  it('uses the native scheme outside the browser', () => {
    expect(resolvePasswordResetRedirect('android', createUrl)).toBe('trainerpro://reset-password');
    expect(resolvePasswordResetRedirect('ios', createUrl)).toBe('trainerpro://reset-password');
  });

  it('uses the hosted mobile web app in the browser', () => {
    expect(resolvePasswordResetRedirect('web', createUrl)).toBe('https://trainer-pro-mobile.expo.app');
  });
});

describe('isNativeRecoveryUrl', () => {
  it('only accepts links that target the reset-password route', () => {
    expect(isNativeRecoveryUrl('trainerpro://reset-password#access_token=a&refresh_token=b')).toBe(true);
    expect(isNativeRecoveryUrl('exp://192.168.1.2:8081/--/reset-password#access_token=a')).toBe(true);
    expect(isNativeRecoveryUrl('trainerpro://other#access_token=a')).toBe(false);
    expect(isNativeRecoveryUrl(null)).toBe(false);
  });
});
