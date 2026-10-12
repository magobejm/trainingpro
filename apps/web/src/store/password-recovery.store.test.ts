import { describe, expect, it, vi } from 'vitest';
import { readRecoveryFromLocation, usePasswordRecoveryStore } from './password-recovery.store';

function fakeScope(hash: string) {
  const replaceState = vi.fn();
  return { history: { replaceState }, location: { hash, pathname: '/app', search: '?x=1' }, replaceState };
}

describe('readRecoveryFromLocation', () => {
  it('returns the tokens and removes them from the URL', () => {
    const scope = fakeScope('#access_token=a&refresh_token=r&type=recovery');
    expect(readRecoveryFromLocation(scope)).toEqual({ accessToken: 'a', refreshToken: 'r', status: 'ready' });
    expect(scope.replaceState).toHaveBeenCalledWith(null, '', '/app?x=1');
  });

  it('also cleans the URL when the link is invalid', () => {
    const scope = fakeScope('#error=access_denied&error_code=otp_expired');
    expect(readRecoveryFromLocation(scope)).toEqual({ status: 'invalid' });
    expect(scope.replaceState).toHaveBeenCalledTimes(1);
  });

  it('leaves unrelated URLs alone', () => {
    const scope = fakeScope('#section');
    expect(readRecoveryFromLocation(scope)).toEqual({ status: 'none' });
    expect(scope.replaceState).not.toHaveBeenCalled();
  });

  it('copes with a missing browser location', () => {
    expect(readRecoveryFromLocation({})).toEqual({ status: 'none' });
  });
});

describe('usePasswordRecoveryStore', () => {
  it('starts idle outside a recovery link', () => {
    expect(usePasswordRecoveryStore.getState().phase).toBe('none');
  });

  it('drops the tokens and flags the update once the password is saved', () => {
    usePasswordRecoveryStore.setState({ accessToken: 'a', phase: 'ready', refreshToken: 'r' });
    usePasswordRecoveryStore.getState().finish();
    expect(usePasswordRecoveryStore.getState()).toMatchObject({
      accessToken: null,
      passwordUpdated: true,
      phase: 'none',
      refreshToken: null,
    });
  });

  it('drops the tokens when the user leaves an invalid link', () => {
    usePasswordRecoveryStore.setState({ accessToken: null, passwordUpdated: false, phase: 'invalid' });
    usePasswordRecoveryStore.getState().dismiss();
    expect(usePasswordRecoveryStore.getState()).toMatchObject({ passwordUpdated: false, phase: 'none' });
  });
});
