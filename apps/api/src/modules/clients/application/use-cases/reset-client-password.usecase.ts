import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { ClientAuthProvisionerService } from '../services/client-auth-provisioner.service';
import { GetClientUseCase } from './get-client.usecase';

@Injectable()
export class ResetClientPasswordUseCase {
  constructor(
    private readonly getClientUseCase: GetClientUseCase,
    private readonly clientAuthProvisioner: ClientAuthProvisionerService,
  ) {}

  async execute(context: AuthContext, clientId: string): Promise<{ temporaryPassword: string }> {
    const client = await this.getClientUseCase.execute(context, clientId);
    const updated = await this.clientAuthProvisioner.rotateClientAuthPassword(client.email);
    return { temporaryPassword: updated.temporaryPassword };
  }
}
