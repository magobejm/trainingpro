import { Inject, Injectable } from '@nestjs/common';
import type { OwnershipPolicyPort } from '../../../../common/ownership/ownership-policy.port';
import { PLANS_REPOSITORY, type PlansRepositoryPort } from '../plans-repository.port';

@Injectable()
export class PlanAccessPolicy implements OwnershipPolicyPort<string> {
    constructor(
        @Inject(PLANS_REPOSITORY)
        private readonly repository: PlansRepositoryPort,
    ) { }

    canAccess(context: { subject: string }, templateId: string): Promise<boolean> {
        return this.repository.canCoachAccessTemplate(context.subject, templateId);
    }
}
