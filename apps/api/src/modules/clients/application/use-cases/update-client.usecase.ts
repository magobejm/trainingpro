import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { Client } from '../../domain/client';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import { CLIENTS_REPOSITORY, type ClientsRepositoryPort } from '../../domain/clients-repository.port';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repository: ClientsRepositoryPort,
  ) {}

  execute(context: AuthContext, clientId: string, input: ClientUpdateInput): Promise<Client> {
    return this.repository.updateClient(context, clientId, input);
  }
}
