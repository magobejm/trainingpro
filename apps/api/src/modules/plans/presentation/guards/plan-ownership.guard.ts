import { Injectable } from '@nestjs/common';
import { BaseOwnershipGuard } from '../../../../common/ownership/base-ownership.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { PlanAccessPolicy } from '../../domain/policies/plan-access.policy';

@Injectable()
export class PlanOwnershipGuard extends BaseOwnershipGuard<string> {
    constructor(policy: PlanAccessPolicy) {
        super(policy);
    }

    protected readResourceId(request: HttpAuthRequest): string {
        const templateId = request.params?.templateId;
        return typeof templateId === 'string' ? templateId : '';
    }
}
