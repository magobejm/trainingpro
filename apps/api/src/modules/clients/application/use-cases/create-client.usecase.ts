import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { ClientAuthProvisionerService } from '../services/client-auth-provisioner.service';
import type { ClientCreateInput } from '../../domain/client-create.input';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';
import type { CreateClientOutput } from './create-client.output';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
    private readonly clientAuthProvisioner: ClientAuthProvisionerService,
  ) {}

  async execute(context: AuthContext, input: ClientCreateInput): Promise<CreateClientOutput> {
    const authUser = await this.clientAuthProvisioner.ensureClientAuthUser(input.email);
    const client = await this.repository.createClient(context, {
      ...input,
      clientSupabaseUid: authUser.userId,
    });
    return {
      client,
      credentials: {
        temporaryPassword: authUser.temporaryPassword,
        userCreated: authUser.created,
      },
    };
  }
}
