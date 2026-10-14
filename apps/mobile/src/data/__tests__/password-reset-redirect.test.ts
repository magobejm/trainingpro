import { resolvePasswordResetRedirect } from '../password-reset-redirect';

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
