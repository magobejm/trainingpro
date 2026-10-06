import { decideSessionTransition, sessionTransitionClearsUserData } from '../session-transition';

describe('decideSessionTransition', () => {
  it('treats the first login as signed in', () => {
    const transition = decideSessionTransition(null, 'SIGNED_IN', { userId: 'user-a' });

    expect(transition).toBe('signedIn');
    expect(sessionTransitionClearsUserData(transition)).toBe(false);
  });

  it('refreshes the same user without clearing data', () => {
    const transition = decideSessionTransition('user-a', 'TOKEN_REFRESHED', { userId: 'user-a' });

    expect(transition).toBe('refreshed');
    expect(sessionTransitionClearsUserData(transition)).toBe(false);
  });

  it('switches user and clears the previous data', () => {
    const transition = decideSessionTransition('user-a', 'SIGNED_IN', { userId: 'user-b' });

    expect(transition).toBe('switchedUser');
    expect(sessionTransitionClearsUserData(transition)).toBe(true);
  });

  it('signs out when the event is SIGNED_OUT or the session is missing', () => {
    expect(decideSessionTransition('user-a', 'SIGNED_OUT', { userId: 'user-a' })).toBe('signedOut');
    expect(decideSessionTransition('user-a', 'INITIAL_SESSION', null)).toBe('signedOut');
    expect(sessionTransitionClearsUserData('signedOut')).toBe(true);
  });
});
