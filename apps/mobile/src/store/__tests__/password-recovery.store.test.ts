import { useAuthStore } from '../auth.store';
import { applyRecoveryUrl, usePasswordRecoveryStore } from '../password-recovery.store';

const RECOVERY_URL = 'trainerpro://reset-password#access_token=abc&refresh_token=def&type=recovery';

describe('applyRecoveryUrl', () => {
  beforeEach(() => {
    usePasswordRecoveryStore.setState({
      accessToken: null,
      passwordUpdated: false,
      phase: 'none',
      refreshToken: null,
    });
    useAuthStore.setState({ accessToken: null, status: 'signedOut', userId: null });
  });

  it('stores a recovery link without starting a session', () => {
    applyRecoveryUrl(RECOVERY_URL);

    expect(usePasswordRecoveryStore.getState()).toMatchObject({
      accessToken: 'abc',
      phase: 'ready',
      refreshToken: 'def',
    });
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('marks a broken recovery link and ignores anything else', () => {
    applyRecoveryUrl('trainerpro://reset-password#type=recovery');
    expect(usePasswordRecoveryStore.getState().phase).toBe('invalid');

    usePasswordRecoveryStore.setState({ phase: 'none' });
    applyRecoveryUrl('trainerpro://reset-password');
    expect(usePasswordRecoveryStore.getState().phase).toBe('none');
  });
});
