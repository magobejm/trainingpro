import { Inject, Injectable } from '@nestjs/common';
import type { OwnershipPolicyPort } from '../../../../common/ownership/ownership-policy.port';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../clients-repository.port';

@Injectable()
export class ClientAccessPolicy implements OwnershipPolicyPort<string> {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  canAccess(context: { subject: string }, clientId: string): Promise<boolean> {
    return this.repository.canCoachAccessClient(context.subject, clientId);
  }
}
