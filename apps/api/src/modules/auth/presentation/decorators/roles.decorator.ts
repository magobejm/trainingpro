import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '../../domain/role';

export const ROLES_METADATA_KEY = 'roles';

export const Roles = (...roles: AppRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_METADATA_KEY, roles);
