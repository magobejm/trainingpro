import { Injectable } from '@nestjs/common';
import { BaseOwnershipGuard } from '../../../../common/ownership/base-ownership.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ClientAccessPolicy } from '../../domain/policies/client-access.policy';

@Injectable()
export class ClientOwnershipGuard extends BaseOwnershipGuard<string> {
  constructor(policy: ClientAccessPolicy) {
    super(policy);
  }

  protected readResourceId(request: HttpAuthRequest): string {
    const clientId = request.params?.clientId;
    return typeof clientId === 'string' ? clientId : '';
  }
}
