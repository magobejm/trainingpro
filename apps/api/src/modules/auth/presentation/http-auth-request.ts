import type { Request } from 'express';
import type { AuthenticatedUser } from '../domain/authenticated-user';
import type { AppRole } from '../domain/role';

export type HttpAuthRequest = Request & {
  activeRole?: AppRole;
  user?: AuthenticatedUser;
};
