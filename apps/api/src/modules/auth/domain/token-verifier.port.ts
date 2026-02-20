import type { AuthenticatedUser } from './authenticated-user';

export type TokenVerifierPort = {
  verify(token: string): Promise<AuthenticatedUser>;
};
