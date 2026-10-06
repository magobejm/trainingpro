export type SessionTransition = 'refreshed' | 'signedIn' | 'signedOut' | 'switchedUser';

export type SessionIdentity = {
  userId: string;
};

export function decideSessionTransition(
  previousUserId: string | null,
  event: string,
  session: SessionIdentity | null,
): SessionTransition {
  if (event === 'SIGNED_OUT' || !session) {
    return 'signedOut';
  }
  if (previousUserId && previousUserId !== session.userId) {
    return 'switchedUser';
  }
  if (!previousUserId) {
    return 'signedIn';
  }
  return 'refreshed';
}

export function sessionTransitionClearsUserData(transition: SessionTransition): boolean {
  return transition === 'signedOut' || transition === 'switchedUser';
}
