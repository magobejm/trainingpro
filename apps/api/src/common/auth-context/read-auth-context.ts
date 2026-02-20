import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { AuthContext } from './auth-context';
import { APP_ROLES, type AppRole } from '../../modules/auth/domain/role';
import type { HttpAuthRequest } from '../../modules/auth/presentation/http-auth-request';

function normalizeRole(role: string): AppRole | null {
  if (!APP_ROLES.includes(role as AppRole)) {
    return null;
  }
  return role as AppRole;
}

export function readAuthContext(request: HttpAuthRequest): AuthContext {
  if (!request.user) {
    throw new UnauthorizedException('Missing authenticated user in request');
  }
  if (!request.activeRole) {
    throw new UnauthorizedException('Missing active role in request');
  }
  const roles = request.user.roles
    .map((role) => role.toLowerCase())
    .map((role) => normalizeRole(role))
    .filter((role): role is AppRole => role !== null);
  if (!roles.includes(request.activeRole)) {
    throw new ForbiddenException('Active role is not part of authenticated user roles');
  }
  return {
    activeRole: request.activeRole,
    email: request.user.email,
    roles,
    subject: request.user.subject,
  };
}
