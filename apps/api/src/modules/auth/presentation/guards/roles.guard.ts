import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { APP_ROLES, type AppRole } from '../../domain/role';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';
import type { HttpAuthRequest } from '../http-auth-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<HttpAuthRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    const activeRole = this.readActiveRole(request);
    const userRoles = new Set(user.roles.map((role) => role.toLowerCase()));
    if (!userRoles.has(activeRole)) {
      throw new ForbiddenException('Active role is not assigned to authenticated user');
    }
    if (!requiredRoles.includes(activeRole)) {
      throw new ForbiddenException('Role is not allowed for this endpoint');
    }
    request.activeRole = activeRole;
    return true;
  }

  private readActiveRole(request: Request): AppRole {
    const rawRole = request.headers['x-active-role'];
    if (typeof rawRole !== 'string') {
      throw new UnauthorizedException('Missing X-Active-Role header');
    }
    const normalized = rawRole.toLowerCase();
    if (!APP_ROLES.includes(normalized as AppRole)) {
      throw new ForbiddenException('Unsupported active role');
    }
    return normalized as AppRole;
  }
}
