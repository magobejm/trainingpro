import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { readAuthContext } from '../auth-context/read-auth-context';
import type { OwnershipPolicyPort } from './ownership-policy.port';
import type { HttpAuthRequest } from '../../modules/auth/presentation/http-auth-request';

@Injectable()
export abstract class BaseOwnershipGuard<TResourceId> implements CanActivate {
  protected constructor(private readonly policy: OwnershipPolicyPort<TResourceId>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HttpAuthRequest>();
    const authContext = readAuthContext(request);
    const resourceId = this.readResourceId(request);
    const canAccess = await this.policy.canAccess(authContext, resourceId);
    if (!canAccess) {
      throw new ForbiddenException('Ownership validation failed');
    }
    return true;
  }

  protected abstract readResourceId(request: HttpAuthRequest): TResourceId;
}
